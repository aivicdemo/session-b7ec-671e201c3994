import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, marshall, unmarshall } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { authorizeRequest } from './rbac';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.MAIN_TABLE || 'work-optimization-table';

const TABLE_INDICES = [
  'facilities',
  'teams',
  'workers',
  'worker_proficiency',
  'work_instructions',
  'work_results',
  'staffing_plans',
  'staffing_execution',
  'progress_data',
  'productivity_data',
  'risk_assessment',
  'instruction_receipt_history',
  'handy_terminal_logs',
  'wms_logs',
  'users',
  'user_permissions',
];

interface AuditLog {
  pk: string;
  sk: string;
  userId: string;
  operationType: string;
  targetTable: string;
  targetId?: string;
  changes?: Record<string, unknown>;
  timestamp: number;
}

async function createAuditLog(
  userId: string,
  operationType: string,
  targetTable: string,
  targetId?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  const auditLog: AuditLog = {
    pk: 'AUDIT',
    sk: `${Date.now()}#${randomUUID()}`,
    userId,
    operationType,
    targetTable,
    targetId,
    changes,
    timestamp: Date.now(),
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: auditLog,
    })
  );
}

function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

function createSuccessResponse(
  statusCode: number,
  data: Record<string, unknown>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function handleGetResources(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const authResult = authorizeRequest(event);
  if (!authResult.authorized || !authResult.context) {
    return createErrorResponse(403, authResult.error || 'Forbidden');
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'attribute_exists(#pk) AND #pk = :pk',
        ExpressionAttributeNames: { '#pk': 'pk' },
        ExpressionAttributeValues: { ':pk': 'FACILITY' },
      })
    );

    const items = result.Items || [];
    return createSuccessResponse(200, {
      resources: items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function handleBulkImport(
  event: APIGatewayProxyEvent,
  tableIndex: number
): Promise<APIGatewayProxyResult> {
  const authResult = authorizeRequest(event, ['admin', 'operator']);
  if (!authResult.authorized || !authResult.context) {
    return createErrorResponse(403, authResult.error || 'Forbidden');
  }

  if (!event.body) {
    return createErrorResponse(400, 'Request body is required');
  }

  try {
    const payload = JSON.parse(event.body);
    if (!Array.isArray(payload.items)) {
      return createErrorResponse(400, 'items must be an array');
    }

    const items = payload.items as Record<string, unknown>[];
    const tableName_mapped = TABLE_INDICES[tableIndex];

    if (!tableName_mapped) {
      return createErrorResponse(400, 'Invalid table index');
    }

    const now = Date.now();
    const enrichedItems = items.map((item) => ({
      ...item,
      pk: tableName_mapped,
      sk: item.id || randomUUID(),
      id: item.id || randomUUID(),
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }));

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < enrichedItems.length; i += 25) {
      const batch = enrichedItems.slice(i, i + 25);
      const requestItems: Record<string, unknown>[] = [];

      for (const item of batch) {
        requestItems.push({
          PutRequest: {
            Item: marshall(item),
          },
        });
      }

      try {
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: requestItems,
            },
          })
        );
        imported += batch.length;
      } catch (batchError) {
        failed += batch.length;
        errors.push(
          `Batch ${Math.floor(i / 25) + 1} failed: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
        );
      }
    }

    await createAuditLog(
      authResult.context.userId,
      'BULK_IMPORT',
      tableName_mapped,
      undefined,
      { imported, failed, itemCount: items.length }
    );

    return createSuccessResponse(200, {
      imported,
      failed,
      errors,
    });
  } catch (error) {
    console.error('Error during bulk import:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const path = event.resource || event.path || '/';
  const method = event.httpMethod || 'GET';

  console.log(`Handling ${method} ${path}`);

  if (path === '/resources' && method === 'GET') {
    return handleGetResources(event);
  }

  const bulkMatch = path.match(/^\/api\/(\d+)\/bulk$/);
  if (bulkMatch && method === 'POST') {
    const tableIndex = parseInt(bulkMatch[1], 10);
    return handleBulkImport(event, tableIndex);
  }

  return createErrorResponse(404, 'Endpoint not found');
}