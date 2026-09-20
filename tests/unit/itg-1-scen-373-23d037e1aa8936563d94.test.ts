import { recordOperationAudit } from '../../src/logic/auth-authorization-audit';

describe('SCEN-373: 操作監査ログ記録 - 成功時のステータス返却', () => {
  it('recordOperationAudit関数が成功時にRECORDEDステータスを返す', async () => {
    // Arrange
    const input = {
      userId: 'USR001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'ALLOC-12345',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"key":"value1"}',
      changeAfterValue: '{"key":"value2"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-ABC123',
      operationDateTime: '2025-01-15T10:30:45Z',
    };

    // Act
    const output = await recordOperationAudit(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.status).toBe('RECORDED');
    expect(output.auditLogId).toBeDefined();
    expect(typeof output.auditLogId).toBe('string');
    expect(output.auditLogId.length).toBeGreaterThan(0);
    expect(output.recordedDateTime).toBeDefined();
    expect(typeof output.recordedDateTime).toBe('string');
    // ISO 8601形式の検証（簡易的）
    expect(output.recordedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});