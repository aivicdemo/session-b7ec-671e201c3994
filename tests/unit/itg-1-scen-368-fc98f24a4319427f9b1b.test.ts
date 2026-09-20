import { recordOperationAudit, RecordOperationAuditInput, RecordOperationAuditOutput } from '../../src/logic/auth-authorization-audit';

describe('SCEN-368: 必須フィールドが全て揃った正常な監査ログ記録により、一意のログIDと記録日時を返す', () => {
  test('should return unique auditLogId and recordedDateTime when all required fields are provided', async () => {
    // Arrange: RecordOperationAuditInput型の入力値を以下の必須フィールドをすべて満たす正常な値で構築する
    const input: RecordOperationAuditInput = {
      userId: 'USR001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'PLAN20240115001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"allocation":"5"}',
      changeAfterValue: '{"allocation":"7"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION_abc123xyz',
      operationDateTime: '2024-01-15T10:30:45Z',
    };

    // Act: recordOperationAudit関数を上記入力値で呼び出す
    const output: RecordOperationAuditOutput = await recordOperationAudit(input);

    // Assert: 返却されたRecordOperationAuditOutput型の出力値を検証する
    // auditLogIdフィールドには空でない一意の監査ログ識別子が文字列で返される
    expect(output.auditLogId).toBeDefined();
    expect(typeof output.auditLogId).toBe('string');
    expect(output.auditLogId).not.toBe('');
    expect(output.auditLogId.length).toBeGreaterThan(0);

    // recordedDateTimeフィールドには呼び出し時刻付近のISO 8601形式の日時文字列が返される
    expect(output.recordedDateTime).toBeDefined();
    expect(typeof output.recordedDateTime).toBe('string');
    const recordedDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    expect(output.recordedDateTime).toMatch(recordedDateRegex);

    // statusフィールドには文字列'RECORDED'が返される
    expect(output.status).toBe('RECORDED');
  });
});