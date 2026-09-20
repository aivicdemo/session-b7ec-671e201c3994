import { findAllocationChangeHistoryByPeriod } from '../../src/logic/persistence-layer';
import * as db from '../../src/db';

jest.mock('../../src/db');

describe('SCEN-661: 指定されたステータスでフィルタリングされた割当変更履歴のみが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only allocation change history records with approved status filtered by period', async () => {
    const requestingUserId = 'user-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-02-28');
    const statusFilter = 'approved';

    const testRecords = [
      {
        allocationChangeHistoryId: 'id-001',
        workerId: 'worker-001',
        previousPlacementPlanId: 'plan-001',
        newPlacementPlanId: 'plan-002',
        previousDepartmentId: 'dept-001',
        newDepartmentId: 'dept-002',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'productivity improvement',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-01-15'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: null,
        approvalDateTime: null,
        status: 'pending',
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T08:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'id-002',
        workerId: 'worker-002',
        previousPlacementPlanId: 'plan-002',
        newPlacementPlanId: 'plan-003',
        previousDepartmentId: 'dept-002',
        newDepartmentId: 'dept-003',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'quality improvement',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-01-20'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: 'user-002',
        approvalDateTime: new Date('2024-01-20T10:00:00Z'),
        status: 'approved',
        createdAt: new Date('2024-01-20T08:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'id-003',
        workerId: 'worker-003',
        previousPlacementPlanId: 'plan-003',
        newPlacementPlanId: 'plan-004',
        previousDepartmentId: 'dept-003',
        newDepartmentId: 'dept-004',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'workload balancing',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-01-25'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: 'user-002',
        approvalDateTime: new Date('2024-01-25T10:00:00Z'),
        status: 'executed',
        createdAt: new Date('2024-01-25T08:00:00Z'),
        updatedAt: new Date('2024-01-25T10:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'id-004',
        workerId: 'worker-004',
        previousPlacementPlanId: 'plan-004',
        newPlacementPlanId: 'plan-005',
        previousDepartmentId: 'dept-004',
        newDepartmentId: 'dept-005',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'skill matching',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-01-30'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: 'user-002',
        approvalDateTime: new Date('2024-01-30T10:00:00Z'),
        status: 'rejected',
        createdAt: new Date('2024-01-30T08:00:00Z'),
        updatedAt: new Date('2024-01-30T10:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'id-005',
        workerId: 'worker-005',
        previousPlacementPlanId: 'plan-005',
        newPlacementPlanId: 'plan-006',
        previousDepartmentId: 'dept-005',
        newDepartmentId: 'dept-006',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'capacity adjustment',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-02-05'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: null,
        approvalDateTime: null,
        status: 'pending',
        createdAt: new Date('2024-02-05T08:00:00Z'),
        updatedAt: new Date('2024-02-05T08:00:00Z'),
      },
    ];

    const filteredRecords = testRecords.filter(
      (record) =>
        record.status === statusFilter &&
        record.changeExecutionDate >= startDate &&
        record.changeExecutionDate <= endDate
    );

    (db.query as jest.Mock).mockResolvedValueOnce({ rows: filteredRecords });

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(1);
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);

    expect(result.allocationChangeHistories).toHaveLength(1);
    expect(result.allocationChangeHistories[0].status).toBe('approved');
    expect(result.allocationChangeHistories[0].changeExecutionDate).toEqual(new Date('2024-01-20'));

    for (let i = 0; i < result.allocationChangeHistories.length - 1; i++) {
      expect(result.allocationChangeHistories[i].changeExecutionDate.getTime()).toBeLessThanOrEqual(
        result.allocationChangeHistories[i + 1].changeExecutionDate.getTime()
      );
    }
  });

  it('should return multiple approved records in chronological order when multiple records exist with approved status', async () => {
    const requestingUserId = 'user-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-02-28');
    const statusFilter = 'approved';

    const allRecords = [
      {
        allocationChangeHistoryId: 'id-006',
        workerId: 'worker-006',
        previousPlacementPlanId: 'plan-006',
        newPlacementPlanId: 'plan-007',
        previousDepartmentId: 'dept-006',
        newDepartmentId: 'dept-007',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'productivity improvement',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-01-10'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: 'user-002',
        approvalDateTime: new Date('2024-01-10T10:00:00Z'),
        status: 'approved',
        createdAt: new Date('2024-01-10T08:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'id-007',
        workerId: 'worker-007',
        previousPlacementPlanId: 'plan-007',
        newPlacementPlanId: 'plan-008',
        previousDepartmentId: 'dept-007',
        newDepartmentId: 'dept-008',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'quality improvement',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-01-20'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: 'user-002',
        approvalDateTime: new Date('2024-01-20T10:00:00Z'),
        status: 'approved',
        createdAt: new Date('2024-01-20T08:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z'),
      },
      {
        allocationChangeHistoryId: 'id-008',
        workerId: 'worker-008',
        previousPlacementPlanId: 'plan-008',
        newPlacementPlanId: 'plan-009',
        previousDepartmentId: 'dept-008',
        newDepartmentId: 'dept-009',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'workload balancing',
        changeReasonDetail: 'test',
        changeExecutionDate: new Date('2024-02-05'),
        plannedChangeDate: null,
        executorUserId: 'user-001',
        approverUserId: 'user-002',
        approvalDateTime: new Date('2024-02-05T10:00:00Z'),
        status: 'approved',
        createdAt: new Date('2024-02-05T08:00:00Z'),
        updatedAt: new Date('2024-02-05T10:00:00Z'),
      },
    ];

    const filteredRecords = allRecords.filter(
      (record) =>
        record.status === statusFilter &&
        record.changeExecutionDate >= startDate &&
        record.changeExecutionDate <= endDate
    );

    (db.query as jest.Mock).mockResolvedValueOnce({ rows: filteredRecords });

    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.allocationChangeHistories).toHaveLength(3);

    result.allocationChangeHistories.forEach((record) => {
      expect(record.status).toBe('approved');
    });

    for (let i = 0; i < result.allocationChangeHistories.length - 1; i++) {
      expect(result.allocationChangeHistories[i].changeExecutionDate.getTime()).toBeLessThanOrEqual(
        result.allocationChangeHistories[i + 1].changeExecutionDate.getTime()
      );
    }
  });
});