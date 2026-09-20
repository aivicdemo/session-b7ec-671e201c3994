import { updateAllocationChangeHistoryStatus, saveAllocationChangeHistory, findAllocationChangeHistoryByWorker } from '../../src/logic/persistence-layer';

describe('SCEN-668: updateAllocationChangeHistoryStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidApprovalDateError when approvalDateTime is before changeExecutionDate', async () => {
    const changeExecutionDate = new Date('2024-01-15T10:00:00Z');
    const invalidApprovalDateTime = new Date('2024-01-14T10:00:00Z');
    const allocationChangeHistoryId = 'history-123';
    const workerIdValue = 'worker-456';
    const previousPlacementPlanId = 'plan-001';
    const newPlacementPlanId = 'plan-002';
    const previousDepartmentId = 'dept-001';
    const newDepartmentId = 'dept-002';
    const changeReason = 'production improvement';
    const executorUserId = 'user-789';
    const requestingUserId = 'user-456';

    // Step 1: 割当変更履歴レコードを事前に作成
    const saveInput = {
      allocationChangeHistoryId: allocationChangeHistoryId,
      workerId: workerIdValue,
      previousPlacementPlanId: previousPlacementPlanId,
      newPlacementPlanId: newPlacementPlanId,
      previousDepartmentId: previousDepartmentId,
      newDepartmentId: newDepartmentId,
      changeReason: changeReason,
      changeExecutionDate: changeExecutionDate,
      executorUserId: executorUserId,
      status: 'pending' as const,
      createdBy: executorUserId,
      requestingUserId: requestingUserId,
    };

    const savedRecord = await saveAllocationChangeHistory(saveInput);
    expect(savedRecord.success).toBe(true);
    expect(savedRecord.allocationChangeHistoryId).toBe(allocationChangeHistoryId);

    // Step 3-8: updateAllocationChangeHistoryStatusを入力値で呼び出す
    const updateInput = {
      allocationChangeHistoryId: allocationChangeHistoryId,
      newStatus: 'approved' as const,
      approverUserId: 'user-123',
      approvalDateTime: invalidApprovalDateTime,
      approvalRemarks: null,
      requestingUserId: requestingUserId,
    };

    // Step 9: InvalidApprovalDateErrorが発生することを確認
    let thrownError: Error | undefined;
    try {
      await updateAllocationChangeHistoryStatus(updateInput);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('InvalidApprovalDateError');

    // Step 10: エラーメッセージが正確であることを確認
    expect(thrownError?.message).toBe('承認日時は変更実行日以降である必要があります。');

    // 期待結果の検証：レコードが更新されていないこと
    const recordAfterError = await findAllocationChangeHistoryByWorker({
      workerId: workerIdValue,
      requestingUserId: requestingUserId,
    });

    expect(recordAfterError.found).toBe(true);

    const targetRecord = recordAfterError.allocationChangeHistories.find(
      (record) => record.allocationChangeHistoryId === allocationChangeHistoryId
    );

    expect(targetRecord).toBeDefined();
    expect(targetRecord?.status).toBe('pending');
    expect(targetRecord?.approverUserId).toBeNull();
    expect(targetRecord?.approvalDateTime).toBeNull();
  });
});