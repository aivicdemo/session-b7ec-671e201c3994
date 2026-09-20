import { recordOperationAudit, RecordOperationAuditInput, RecordOperationAuditOutput } from '../../src/logic/auth-authorization-audit';
import { Pool } from 'pg';

describe('SCEN-374: operationStatusの値が正しく記録される', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost/test_db',
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  const baseInput: Omit<RecordOperationAuditInput, 'operationStatus'> = {
    userId: 'user-123',
    operationType: 'UPDATE',
    operationTargetTable: '人員配置案',
    operationTargetId: 'record-456',
    ipAddress: '192.168.1.1',
    sessionId: 'session-789',
    operationDateTime: new Date().toISOString(),
  };

  test('operationStatusが「SUCCESS」の場合、正しく記録される', async () => {
    const input: RecordOperationAuditInput = {
      ...baseInput,
      operationStatus: 'SUCCESS',
    };

    const result = await recordOperationAudit(input);

    expect(result.status).toBe('RECORDED');
    expect(result.auditLogId).toBeTruthy();
    expect(result.auditLogId).not.toBe('');
    expect(result.recordedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const dbResult = await pool.query(
      'SELECT operation_status FROM 操作履歴 WHERE audit_log_id = $1',
      [result.auditLogId]
    );
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].operation_status).toBe('SUCCESS');
  });

  test('operationStatusが「FAILURE」の場合、正しく記録される', async () => {
    const input: RecordOperationAuditInput = {
      ...baseInput,
      operationStatus: 'FAILURE',
      errorMessage: 'Insufficient permissions',
    };

    const result = await recordOperationAudit(input);

    expect(result.status).toBe('RECORDED');
    expect(result.auditLogId).toBeTruthy();
    expect(result.auditLogId).not.toBe('');
    expect(result.recordedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const dbResult = await pool.query(
      'SELECT operation_status FROM 操作履歴 WHERE audit_log_id = $1',
      [result.auditLogId]
    );
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].operation_status).toBe('FAILURE');
  });

  test('operationStatusが「PARTIAL_FAILURE」の場合、正しく記録される', async () => {
    const input: RecordOperationAuditInput = {
      ...baseInput,
      operationStatus: 'PARTIAL_FAILURE',
      errorMessage: 'Some records failed to update',
    };

    const result = await recordOperationAudit(input);

    expect(result.status).toBe('RECORDED');
    expect(result.auditLogId).toBeTruthy();
    expect(result.auditLogId).not.toBe('');
    expect(result.recordedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const dbResult = await pool.query(
      'SELECT operation_status FROM 操作履歴 WHERE audit_log_id = $1',
      [result.auditLogId]
    );
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].operation_status).toBe('PARTIAL_FAILURE');
  });
});