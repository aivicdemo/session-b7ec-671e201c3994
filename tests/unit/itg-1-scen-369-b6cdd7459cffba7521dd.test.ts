import { recordOperationAudit } from '../../src/logic/auth-authorization-audit';

describe('SCEN-369: 監査ログ記録の必須フィールド検証', () => {
  it('userIdがnullの場合、InvalidAuditInputErrorが発生する', async () => {
    const invalidInput = {
      userId: null as any,
      operationType: 'CREATE',
      operationTargetTable: '人員配置案',
      operationTargetId: '550e8400-e29b-41d4-a716-446655440000',
      operationStatus: 'SUCCESS',
      ipAddress: '192.168.1.1',
      sessionId: 'sess_123456',
      operationDateTime: new Date().toISOString(),
    };

    await expect(recordOperationAudit(invalidInput)).rejects.toMatchObject({
      name: 'InvalidAuditInputError',
      message: '監査ログ記録に必須フィールドが不足しています。',
    });
  });

  it('operationTypeが空文字列の場合、InvalidAuditInputErrorが発生する', async () => {
    const invalidInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: '',
      operationTargetTable: '人員配置案',
      operationTargetId: '550e8400-e29b-41d4-a716-446655440001',
      operationStatus: 'SUCCESS',
      ipAddress: '192.168.1.1',
      sessionId: 'sess_123456',
      operationDateTime: new Date().toISOString(),
    };

    await expect(recordOperationAudit(invalidInput)).rejects.toMatchObject({
      name: 'InvalidAuditInputError',
      message: '監査ログ記録に必須フィールドが不足しています。',
    });
  });

  it('operationTargetTableがnullの場合、InvalidAuditInputErrorが発生する', async () => {
    const invalidInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'UPDATE',
      operationTargetTable: null as any,
      operationTargetId: '550e8400-e29b-41d4-a716-446655440001',
      operationStatus: 'SUCCESS',
      ipAddress: '192.168.1.1',
      sessionId: 'sess_123456',
      operationDateTime: new Date().toISOString(),
    };

    await expect(recordOperationAudit(invalidInput)).rejects.toMatchObject({
      name: 'InvalidAuditInputError',
      message: '監査ログ記録に必須フィールドが不足しています。',
    });
  });

  it('operationTargetIdが無効なUUID形式の場合、InvalidAuditInputErrorが発生する', async () => {
    const invalidInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'DELETE',
      operationTargetTable: '進捗データ',
      operationTargetId: 'invalid-uuid',
      operationStatus: 'SUCCESS',
      ipAddress: '192.168.1.1',
      sessionId: 'sess_123456',
      operationDateTime: new Date().toISOString(),
    };

    await expect(recordOperationAudit(invalidInput)).rejects.toMatchObject({
      name: 'InvalidAuditInputError',
      message: '監査ログ記録に必須フィールドが不足しています。',
    });
  });

  it('operationStatusがnullの場合、InvalidAuditInputErrorが発生する', async () => {
    const invalidInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'APPROVE',
      operationTargetTable: '人員配置案',
      operationTargetId: '550e8400-e29b-41d4-a716-446655440001',
      operationStatus: null as any,
      ipAddress: '192.168.1.1',
      sessionId: 'sess_123456',
      operationDateTime: new Date().toISOString(),
    };

    await expect(recordOperationAudit(invalidInput)).rejects.toMatchObject({
      name: 'InvalidAuditInputError',
      message: '監査ログ記録に必須フィールドが不足しています。',
    });
  });
});