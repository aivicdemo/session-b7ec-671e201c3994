import { DeleteDataByConditionAndTypeInput, DeleteDataByConditionAndTypeOutput } from '../../src/logic/data-persistence';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

describe('SCEN-1146: deleteDataByConditionAndType - レコードが存在しない場合', () => {
  let authorizeOperationStub: jest.Mock;
  let validateReferentialIntegrityStub: jest.Mock;
  let recordOperationAuditStub: jest.Mock;
  let deleteDataByConditionAndTypeImpl: jest.SpyInstance;

  beforeEach(() => {
    authorizeOperationStub = jest.fn().mockResolvedValue(true);
    validateReferentialIntegrityStub = jest.fn().mockResolvedValue({ isValid: true, violations: [] });
    recordOperationAuditStub = jest.fn().mockResolvedValue({ auditLogId: 'audit-001' });

    jest.spyOn(dataPersistenceModule, 'authorizeOperation' as any).mockImplementation(authorizeOperationStub);
    jest.spyOn(dataPersistenceModule, 'validateReferentialIntegrity' as any).mockImplementation(validateReferentialIntegrityStub);
    jest.spyOn(dataPersistenceModule, 'recordOperationAudit' as any).mockImplementation(recordOperationAuditStub);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('検索条件に合致するレコードが存在しない場合、論理削除は実行されて削除件数は0で返される', async () => {
    // 入力オブジェクトを構築
    const input: DeleteDataByConditionAndTypeInput = {
      dataType: 'worker',
      filterCondition: { id: 'WORKER-999' },
      deletedBy: 'admin-user-001',
    };

    // authorizeOperation スタブを設定：削除権限を持つことを返す
    authorizeOperationStub.mockResolvedValue(true);

    // validateReferentialIntegrity スタブを設定：参照整合性違反がないことを返す
    // フィルタ条件に合致するレコード（件数0）について参照整合性違反がないことを返す
    validateReferentialIntegrityStub.mockResolvedValue({
      isValid: true,
      violations: [],
      matchedRecordCount: 0,
    });

    // recordOperationAudit スタブを設定：削除操作の監査ログ記録に成功することを返す
    recordOperationAuditStub.mockResolvedValue({
      auditLogId: 'audit-log-20250120-001',
    });

    // deleteDataByConditionAndType を呼び出す
    const result: DeleteDataByConditionAndTypeOutput = await dataPersistenceModule.deleteDataByConditionAndType(input);

    // 検証：返却されるオブジェクトの内容
    expect(result.dataType).toBe('worker');
    expect(result.deletedRecordCount).toBe(0);
    expect(result.isLogicalDelete).toBe(true);

    // deletedAt が ISO 8601 形式の現在日時であることを確認
    expect(result.deletedAt).toBeDefined();
    const deletedAtDate = new Date(result.deletedAt);
    expect(deletedAtDate).toBeInstanceOf(Date);
    expect(deletedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // authorizeOperation が正しい引数で呼ばれていることを確認
    expect(authorizeOperationStub).toHaveBeenCalledWith(
      'admin-user-001',
      'worker',
      'delete'
    );

    // validateReferentialIntegrity が正しい引数で呼ばれていることを確認
    expect(validateReferentialIntegrityStub).toHaveBeenCalledWith(
      'worker',
      { id: 'WORKER-999' }
    );

    // recordOperationAudit が正しい引数で呼ばれていることを確認
    expect(recordOperationAuditStub).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-user-001',
        operationType: 'logical_delete',
        targetDataType: 'worker',
        filterCondition: { id: 'WORKER-999' },
        deletedRecordCount: 0,
        status: 'completed',
      })
    );

    // 論理削除が実行されたことを確認（isLogicalDelete = true）
    expect(result.isLogicalDelete).toBe(true);

    // 検索条件に合致するレコードが存在しないため削除対象件数は0件であることを確認
    expect(result.deletedRecordCount).toBe(0);
  });
});