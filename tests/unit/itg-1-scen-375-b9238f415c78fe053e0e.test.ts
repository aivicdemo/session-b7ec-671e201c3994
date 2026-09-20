import { recordOperationAudit } from '../../src/logic/auth-authorization-audit';
import { RecordOperationAuditInput, RecordOperationAuditOutput } from '../../src/logic/auth-authorization-audit';

describe('SCEN-375: operationDateTimeがISO 8601形式で正しく記録される', () => {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;

  test('ミリ秒付きISO 8601形式のoperationDateTimeが正しく記録される', () => {
    const input: RecordOperationAuditInput = {
      userId: 'USER001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'PLAN-2024-001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"value":"before"}',
      changeAfterValue: '{"value":"after"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-ABC123',
      operationDateTime: '2024-01-15T09:30:45.123Z',
    };

    const output: RecordOperationAuditOutput = recordOperationAudit(input);

    expect(output.auditLogId).toBeTruthy();
    expect(output.auditLogId.length).toBeGreaterThan(0);
    expect(output.recordedDateTime).toMatch(iso8601Regex);
    expect(output.status).toBe('RECORDED');
  });

  test('ミリ秒なしISO 8601形式のoperationDateTimeが正しく記録される', () => {
    const input: RecordOperationAuditInput = {
      userId: 'USER001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'PLAN-2024-001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"value":"before"}',
      changeAfterValue: '{"value":"after"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-ABC123',
      operationDateTime: '2024-01-15T09:30:45Z',
    };

    const output: RecordOperationAuditOutput = recordOperationAudit(input);

    expect(output.auditLogId).toBeTruthy();
    expect(output.auditLogId.length).toBeGreaterThan(0);
    expect(output.recordedDateTime).toMatch(iso8601Regex);
    expect(output.status).toBe('RECORDED');
  });

  test('タイムゾーンオフセット付きISO 8601形式のoperationDateTimeが正しく記録される', () => {
    const input: RecordOperationAuditInput = {
      userId: 'USER001',
      operationType: 'UPDATE',
      operationTargetTable: '人員配置案',
      operationTargetId: 'PLAN-2024-001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: '{"value":"before"}',
      changeAfterValue: '{"value":"after"}',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-ABC123',
      operationDateTime: '2024-01-15T09:30:45+09:00',
    };

    const output: RecordOperationAuditOutput = recordOperationAudit(input);

    expect(output.auditLogId).toBeTruthy();
    expect(output.auditLogId.length).toBeGreaterThan(0);
    expect(output.recordedDateTime).toMatch(iso8601Regex);
    expect(output.status).toBe('RECORDED');
  });

  test('複数のISO 8601バリエーション入力に対してrecordedDateTimeが一貫してISO 8601形式で記録される', () => {
    const operationDateTimes = [
      '2024-01-15T09:30:45.123Z',
      '2024-01-15T09:30:45Z',
      '2024-01-15T09:30:45+09:00',
    ];

    const outputs: RecordOperationAuditOutput[] = operationDateTimes.map((opDateTime) => {
      const input: RecordOperationAuditInput = {
        userId: 'USER001',
        operationType: 'UPDATE',
        operationTargetTable: '人員配置案',
        operationTargetId: 'PLAN-2024-001',
        operationStatus: 'SUCCESS',
        changeBeforeValue: '{"value":"before"}',
        changeAfterValue: '{"value":"after"}',
        errorMessage: null,
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-ABC123',
        operationDateTime: opDateTime,
      };
      return recordOperationAudit(input);
    });

    outputs.forEach((output) => {
      expect(output.auditLogId).toBeTruthy();
      expect(output.auditLogId.length).toBeGreaterThan(0);
      expect(output.recordedDateTime).toMatch(iso8601Regex);
      expect(output.status).toBe('RECORDED');
    });
  });
});