import { recordOperationAudit } from '../../src/logic/auth-authorization-audit';
import type {
  RecordOperationAuditInput,
  RecordOperationAuditOutput,
} from '../../src/logic/auth-authorization-audit';

describe('SCEN-371: 更新操作の際に変更前後の値がJSON文字列として正しく記録される', () => {
  it('UPDATE操作の監査ログに変更前後のJSON文字列が正確に記録される', async () => {
    // 入力値の準備
    const input: RecordOperationAuditInput = {
      userId: 'user-001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'plan-12345',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"field1":"value1","field2":"value2"}',
      changeAfterValue: '{"field1":"value1_updated","field2":"value2"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationDateTime: '2024-01-15T10:30:00Z',
    };

    // recordOperationAudit関数を実行
    const output: RecordOperationAuditOutput = await recordOperationAudit(input);

    // statusフィールドが'RECORDED'であることを検証
    expect(output.status).toBe('RECORDED');

    // auditLogIdフィールドが空でない文字列であることを検証
    expect(output.auditLogId).toBeDefined();
    expect(typeof output.auditLogId).toBe('string');
    expect(output.auditLogId.length).toBeGreaterThan(0);

    // recordedDateTimeフィールドがISO 8601形式の日時文字列であることを検証
    expect(output.recordedDateTime).toBeDefined();
    expect(typeof output.recordedDateTime).toBe('string');
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(output.recordedDateTime).toMatch(dateTimeRegex);

    // ISO 8601形式の日時が有効な日付であることを検証
    const parsedDateTime = new Date(output.recordedDateTime);
    expect(parsedDateTime.toString()).not.toBe('Invalid Date');

    // 記録された監査ログのchangeBeforeValueが入力値と正確に一致していることを検証
    expect(output.changeBeforeValue).toBe('{"field1":"value1","field2":"value2"}');

    // 記録された監査ログのchangeAfterValueが入力値と正確に一致していることを検証
    expect(output.changeAfterValue).toBe('{"field1":"value1_updated","field2":"value2"}');

    // JSON文字列が有効なJSON形式であることを検証
    const beforeValue = JSON.parse(output.changeBeforeValue!);
    expect(beforeValue).toEqual({ field1: 'value1', field2: 'value2' });

    const afterValue = JSON.parse(output.changeAfterValue!);
    expect(afterValue).toEqual({ field1: 'value1_updated', field2: 'value2' });
  });
});