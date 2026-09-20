import { deleteDataByConditionAndType } from '../../src/logic/data-persistence';
import * as authAudit from '../../src/logic/auth-authorization-audit';
import * as validation from '../../src/logic/validation-common-calculation';

describe('SCEN-1144: 論理削除実行時のisLogicalDeleteフラグ検証', () => {
  const mockUserId = 'admin-user-001';
  const mockDataType = 'facility';
  const mockFilterCondition = { id: 'FAC001' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('論理削除が実行された場合、出力のisLogicalDeleteフラグは常にtrueである', async () => {
    // スタブ化: authorizeOperation - 削除権限を持つことを返す
    jest.spyOn(authAudit, 'authorizeOperation').mockResolvedValue({
      authorized: true,
      userId: mockUserId,
      operation: 'delete',
      resourceType: mockDataType,
    });

    // スタブ化: validateReferentialIntegrity - 参照整合性制約違反がないことを返す
    jest.spyOn(validation, 'validateReferentialIntegrity').mockResolvedValue({
      valid: true,
      violations: [],
    });

    // スタブ化: recordOperationAudit - 監査ログ記録成功を返す
    jest.spyOn(authAudit, 'recordOperationAudit').mockResolvedValue({
      auditId: 'audit-12345',
      recordedAt: new Date().toISOString(),
    });

    // deleteDataByConditionAndType を呼び出す
    const result = await deleteDataByConditionAndType({
      dataType: mockDataType,
      filterCondition: mockFilterCondition,
      deletedBy: mockUserId,
    });

    // 出力型 DeleteDataByConditionAndTypeOutput を検証
    expect(result).toBeDefined();
    expect(result.dataType).toBe(mockDataType);
    expect(result.isLogicalDelete).toBe(true);
    expect(result.deletedRecordCount).toBeGreaterThanOrEqual(1);
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});