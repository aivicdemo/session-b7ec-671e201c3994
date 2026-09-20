import { findAllocationChangeHistoryByPeriod } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-660: ステータスフィルタなしで検索すると全ステータスの割当変更履歴が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockRecords = [
      {
        allocationChangeHistoryId: 'record-1',
        workerId: 'worker-1',
        previousPlacementPlanId: 'plan-1',
        newPlacementPlanId: 'plan-2',
        previousDepartmentId: 'dept-1',
        newDepartmentId: 'dept-2',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'test',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-05T10:00:00Z'),
        plannedChangeDate: null,
        executorUserId: 'user-1',
        approverUserId: null,
        approvalDateTime: null,
        status: 'pending',
        createdAt: new Date('2024-01-05T09:00:00Z'),
        updatedAt: new Date('2024-01-05T09:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'record-2',
        workerId: 'worker-2',
        previousPlacementPlanId: 'plan-3',
        newPlacementPlanId: 'plan-4',
        previousDepartmentId: 'dept-3',
        newDepartmentId: 'dept-4',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'test',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-10T10:00:00Z'),
        plannedChangeDate: null,
        executorUserId: 'user-1',
        approverUserId: 'user-2',
        approvalDateTime: new Date('2024-01-10T11:00:00Z'),
        status: 'approved',
        createdAt: new Date('2024-01-10T09:00:00Z'),
        updatedAt: new Date('2024-01-10T11:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'record-3',
        workerId: 'worker-3',
        previousPlacementPlanId: 'plan-5',
        newPlacementPlanId: 'plan-6',
        previousDepartmentId: 'dept-5',
        newDepartmentId: 'dept-6',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'test',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-15T10:00:00Z'),
        plannedChangeDate: null,
        executorUserId: 'user-1',
        approverUserId: 'user-2',
        approvalDateTime: new Date('2024-01-15T11:00:00Z'),
        status: 'executed',
        createdAt: new Date('2024-01-15T09:00:00Z'),
        updatedAt: new Date('2024-01-15T11:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'record-4',
        workerId: 'worker-4',
        previousPlacementPlanId: 'plan-7',
        newPlacementPlanId: 'plan-8',
        previousDepartmentId: 'dept-7',
        newDepartmentId: 'dept-8',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'test',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-20T10:00:00Z'),
        plannedChangeDate: null,
        executorUserId: 'user-1',
        approverUserId: 'user-2',
        approvalDateTime: new Date('2024-01-20T11:00:00Z'),
        status: 'rejected',
        createdAt: new Date('2024-01-20T09:00:00Z'),
        updatedAt: new Date('2024-01-20T11:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'record-5',
        workerId: 'worker-5',
        previousPlacementPlanId: 'plan-9',
        newPlacementPlanId: 'plan-10',
        previousDepartmentId: 'dept-9',
        newDepartmentId: 'dept-10',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'test',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-25T10:00:00Z'),
        plannedChangeDate: null,
        executorUserId: 'user-1',
        approverUserId: null,
        approvalDateTime: null,
        status: 'pending',
        createdAt: new Date('2024-01-25T09:00:00Z'),
        updatedAt: new Date('2024-01-25T09:00:00Z'),
      },
    ];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    (persistenceLayer.findAllocationChangeHistoryByPeriod as jest.Mock).mockResolvedValue({
      allocationChangeHistories: mockRecords,
      totalCount: 5,
      found: true,
      periodStartDate: startDate,
      periodEndDate: endDate,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('指定された期間内に実行された全ステータスの割当変更履歴レコードを時系列で取得する', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-001';

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId,
    });

    expect(result.allocationChangeHistories).toHaveLength(5);

    const statuses = result.allocationChangeHistories.map((record) => record.status);
    const expectedStatuses = ['pending', 'approved', 'executed', 'rejected'];
    
    expectedStatuses.forEach((status) => {
      expect(statuses).toContain(status);
    });

    statuses.forEach((status) => {
      expect(expectedStatuses).toContain(status);
    });

    expect(statuses.filter((s) => s === 'pending')).toHaveLength(2);

    expect(result.totalCount).toBe(5);

    expect(result.found).toBe(true);

    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);

    const executionDates = result.allocationChangeHistories.map((record) => record.changeExecutionDate);
    for (let i = 0; i < executionDates.length - 1; i++) {
      expect(executionDates[i].getTime()).toBeLessThanOrEqual(executionDates[i + 1].getTime());
    }

    expect(persistenceLayer.findAllocationChangeHistoryByPeriod).toHaveBeenCalledWith({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId,
    });
  });
});