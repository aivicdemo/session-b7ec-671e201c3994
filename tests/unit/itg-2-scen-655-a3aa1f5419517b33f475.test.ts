import { findAllocationChangeHistoryByWorker, FindAllocationChangeHistoryByWorkerInput, FindAllocationChangeHistoryByWorkerOutput } from '../../src/logic/persistence-layer';

describe('SCEN-655: 割当変更履歴検索 - 存在する場合のfoundフラグとtotalCount検証', () => {
  test('割当変更履歴が存在する場合、foundフラグがtrueで、totalCountに正確な件数が設定される', async () => {
    const workerId = 'W001';
    const requestingUserId = 'U100';

    const mockAllocationChangeHistories = [
      {
        allocationChangeHistoryId: 'ACH001',
        workerId,
        previousPlacementPlanId: 'PP001',
        newPlacementPlanId: 'PP002',
        previousDepartmentId: 'D001',
        newDepartmentId: 'D002',
        previousWorkTypeId: 'WT001',
        newWorkTypeId: 'WT002',
        changeReason: '生産性向上',
        changeReasonDetail: '生産性が10%向上したため次レベルの作業へ配置',
        changeExecutionDate: new Date('2024-01-15T09:00:00Z'),
        plannedChangeDate: new Date('2024-01-15T09:00:00Z'),
        executorUserId: 'U100',
        approverUserId: 'U050',
        approvalDateTime: new Date('2024-01-15T08:30:00Z'),
        status: 'executed',
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'ACH002',
        workerId,
        previousPlacementPlanId: 'PP002',
        newPlacementPlanId: 'PP003',
        previousDepartmentId: 'D002',
        newDepartmentId: 'D003',
        previousWorkTypeId: 'WT002',
        newWorkTypeId: 'WT003',
        changeReason: 'スキル育成',
        changeReasonDetail: 'より難度の高い作業で実践スキルを習得',
        changeExecutionDate: new Date('2024-02-20T10:00:00Z'),
        plannedChangeDate: new Date('2024-02-20T10:00:00Z'),
        executorUserId: 'U100',
        approverUserId: 'U050',
        approvalDateTime: new Date('2024-02-20T09:30:00Z'),
        status: 'executed',
        createdAt: new Date('2024-02-20T09:00:00Z'),
        updatedAt: new Date('2024-02-20T10:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'ACH003',
        workerId,
        previousPlacementPlanId: 'PP003',
        newPlacementPlanId: 'PP004',
        previousDepartmentId: 'D003',
        newDepartmentId: 'D004',
        previousWorkTypeId: 'WT003',
        newWorkTypeId: null,
        changeReason: '負荷分散',
        changeReasonDetail: 'D003部門の過負荷を軽減するため配置を調整',
        changeExecutionDate: new Date('2024-03-10T11:00:00Z'),
        plannedChangeDate: new Date('2024-03-10T11:00:00Z'),
        executorUserId: 'U100',
        approverUserId: 'U050',
        approvalDateTime: new Date('2024-03-10T10:30:00Z'),
        status: 'executed',
        createdAt: new Date('2024-03-10T10:00:00Z'),
        updatedAt: new Date('2024-03-10T11:00:00Z'),
      },
    ];

    jest.spyOn(require('../../src/logic/persistence-layer'), 'findAllocationChangeHistoryByWorker').mockResolvedValueOnce({
      allocationChangeHistories: mockAllocationChangeHistories,
      totalCount: 3,
      found: true,
      workerId,
    } as FindAllocationChangeHistoryByWorkerOutput);

    const input: FindAllocationChangeHistoryByWorkerInput = {
      workerId,
      requestingUserId,
    };

    const result = await findAllocationChangeHistoryByWorker(input);

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.allocationChangeHistories).toHaveLength(3);
    expect(result.workerId).toBe(workerId);

    expect(result.allocationChangeHistories[0].changeExecutionDate).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(result.allocationChangeHistories[1].changeExecutionDate).toEqual(new Date('2024-02-20T10:00:00Z'));
    expect(result.allocationChangeHistories[2].changeExecutionDate).toEqual(new Date('2024-03-10T11:00:00Z'));

    expect(result.allocationChangeHistories[0].allocationChangeHistoryId).toBe('ACH001');
    expect(result.allocationChangeHistories[1].allocationChangeHistoryId).toBe('ACH002');
    expect(result.allocationChangeHistories[2].allocationChangeHistoryId).toBe('ACH003');

    expect(result.allocationChangeHistories[0].previousDepartmentId).toBe('D001');
    expect(result.allocationChangeHistories[0].newDepartmentId).toBe('D002');
    expect(result.allocationChangeHistories[1].previousDepartmentId).toBe('D002');
    expect(result.allocationChangeHistories[1].newDepartmentId).toBe('D003');
    expect(result.allocationChangeHistories[2].previousDepartmentId).toBe('D003');
    expect(result.allocationChangeHistories[2].newDepartmentId).toBe('D004');
  });
});