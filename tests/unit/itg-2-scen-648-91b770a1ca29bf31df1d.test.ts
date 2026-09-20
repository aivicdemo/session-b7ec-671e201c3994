import { saveAllocationChangeHistory } from '../../src/logic/persistence-layer';

describe('SCEN-648: 割当変更履歴の正常系保存（オプションフィールドnull/undefined対応）', () => {
  it('変更前作業タイプID、変更後作業タイプID、変更理由詳細、予定変更日、承認者ユーザーID、承認日時がnull/undefinedの状態で保存すると、成功結果が返される', async () => {
    const input = {
      allocationChangeHistoryId: 'ALC-001',
      workerId: 'WKR-123',
      previousPlacementPlanId: 'PPL-001',
      newPlacementPlanId: 'PPL-002',
      previousDepartmentId: 'DEP-A',
      newDepartmentId: 'DEP-B',
      previousWorkTypeId: undefined,
      newWorkTypeId: undefined,
      changeReason: '生産性向上',
      changeReasonDetail: undefined,
      changeExecutionDate: new Date('2025-01-15'),
      plannedChangeDate: undefined,
      executorUserId: 'USR-001',
      approverUserId: undefined,
      approvalDateTime: undefined,
      status: 'pending',
      createdBy: 'USR-001',
      requestingUserId: 'USR-001',
    };

    const result = await saveAllocationChangeHistory(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.allocationChangeHistoryId).toBe('ALC-001');
    expect(result.workerId).toBe('WKR-123');
    expect(result.previousPlacementPlanId).toBe('PPL-001');
    expect(result.newPlacementPlanId).toBe('PPL-002');
    expect(result.changeExecutionDate).toEqual(new Date('2025-01-15'));
    expect(result.status).toBe('pending');
    expect(result.savedAt).toBeDefined();
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.message).toBeUndefined();
  });
});