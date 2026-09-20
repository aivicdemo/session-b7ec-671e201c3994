import { updateAllocationChangeHistoryStatus } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('updateAllocationChangeHistoryStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な割当変更履歴IDで承認ステータスに更新すると、レコードが更新され成功結果が返される', async () => {
    const allocationChangeHistoryId = 'ACH-001';
    const workerId = 'W001';
    const previousStatus = 'pending';
    const newStatus = 'approved';
    const approverUserId = 'USR-APPROVER';
    const requestingUserId = 'USR-OPERATOR';
    const approvalDateTime = new Date();
    const approvalRemarks = '承認します';
    const beforeCallTime = new Date();

    // スタブ: authorizeUserAction が requestingUserId に対して承認権限を付与
    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    // スタブ: validateInputData が入力値を全て有効と判定
    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      valid: true,
    });

    // スタブ: findAllocationChangeHistoryByWorker が allocationChangeHistoryId に対応するレコードを返却
    (persistenceLayer.findAllocationChangeHistoryByWorker as jest.Mock).mockResolvedValue({
      allocationChangeHistories: [
        {
          allocationChangeHistoryId,
          workerId,
          previousPlacementPlanId: 'PP-001',
          newPlacementPlanId: 'PP-002',
          previousDepartmentId: 'D-001',
          newDepartmentId: 'D-002',
          previousWorkTypeId: null,
          newWorkTypeId: null,
          changeReason: 'test reason',
          changeReasonDetail: null,
          changeExecutionDate: new Date(),
          plannedChangeDate: null,
          executorUserId: 'USR-EXECUTOR',
          approverUserId: null,
          approvalDateTime: null,
          status: previousStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      totalCount: 1,
      found: true,
      workerId,
    });

    const result = await updateAllocationChangeHistoryStatus({
      allocationChangeHistoryId,
      newStatus,
      approverUserId,
      approvalDateTime,
      approvalRemarks,
      requestingUserId,
    });

    const afterCallTime = new Date();

    // 権限検証が実行されたことを確認
    expect(persistenceLayer.authorizeUserAction).toHaveBeenCalled();

    // 入力値検証が実行されたことを確認
    expect(persistenceLayer.validateInputData).toHaveBeenCalled();

    // 割当変更履歴検索が実行されたことを確認
    expect(persistenceLayer.findAllocationChangeHistoryByWorker).toHaveBeenCalled();

    // 戻り値の検証
    expect(result.success).toBe(true);
    expect(result.allocationChangeHistoryId).toBe('ACH-001');
    expect(result.workerId).toBe('W001');
    expect(result.previousStatus).toBe('pending');
    expect(result.newStatus).toBe('approved');
    expect(result.approverUserId).toBe('USR-APPROVER');
    expect(result.approvalDateTime).toEqual(approvalDateTime);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(result.updatedAt.getTime()).toBeLessThanOrEqual(afterCallTime.getTime());
  });
});