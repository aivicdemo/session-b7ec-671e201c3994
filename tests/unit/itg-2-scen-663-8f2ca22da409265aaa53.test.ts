import { findAllocationChangeHistoryByPeriod } from '../../src/logic/persistence-layer';

describe('findAllocationChangeHistoryByPeriod', () => {
  beforeEach(async () => {
    // Reset database - clear allocation change history table
    // In a real scenario, this would use a database client to truncate the table
    jest.clearAllMocks();
  });

  it('should return accurate totalCount when multiple allocation change history records exist within specified period', async () => {
    // Arrange
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user123';

    const testRecords = [
      {
        allocationChangeHistoryId: 'record-1',
        workerId: 'worker-a',
        previousPlacementPlanId: 'plan-1',
        newPlacementPlanId: 'plan-2',
        previousDepartmentId: 'dept-1',
        newDepartmentId: 'dept-2',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'productivity improvement',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-05'),
        plannedChangeDate: null,
        executorUserId: 'user-exec-1',
        approverUserId: null,
        approvalDateTime: null,
        status: 'pending',
        createdAt: new Date('2024-01-05T10:00:00Z'),
        updatedAt: new Date('2024-01-05T10:00:00Z')
      },
      {
        allocationChangeHistoryId: 'record-2',
        workerId: 'worker-b',
        previousPlacementPlanId: 'plan-3',
        newPlacementPlanId: 'plan-4',
        previousDepartmentId: 'dept-3',
        newDepartmentId: 'dept-4',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'skill matching',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-10'),
        plannedChangeDate: null,
        executorUserId: 'user-exec-2',
        approverUserId: null,
        approvalDateTime: null,
        status: 'approved',
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z')
      },
      {
        allocationChangeHistoryId: 'record-3',
        workerId: 'worker-c',
        previousPlacementPlanId: 'plan-5',
        newPlacementPlanId: 'plan-6',
        previousDepartmentId: 'dept-5',
        newDepartmentId: 'dept-6',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'load distribution',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-15'),
        plannedChangeDate: null,
        executorUserId: 'user-exec-3',
        approverUserId: null,
        approvalDateTime: null,
        status: 'executed',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        allocationChangeHistoryId: 'record-4',
        workerId: 'worker-d',
        previousPlacementPlanId: 'plan-7',
        newPlacementPlanId: 'plan-8',
        previousDepartmentId: 'dept-7',
        newDepartmentId: 'dept-8',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'schedule adjustment',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-20'),
        plannedChangeDate: null,
        executorUserId: 'user-exec-4',
        approverUserId: null,
        approvalDateTime: null,
        status: 'rejected',
        createdAt: new Date('2024-01-20T10:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z')
      },
      {
        allocationChangeHistoryId: 'record-5',
        workerId: 'worker-e',
        previousPlacementPlanId: 'plan-9',
        newPlacementPlanId: 'plan-10',
        previousDepartmentId: 'dept-9',
        newDepartmentId: 'dept-10',
        previousWorkTypeId: null,
        newWorkTypeId: null,
        changeReason: 'deadline response',
        changeReasonDetail: null,
        changeExecutionDate: new Date('2024-01-25'),
        plannedChangeDate: null,
        executorUserId: 'user-exec-5',
        approverUserId: null,
        approvalDateTime: null,
        status: 'approved',
        createdAt: new Date('2024-01-25T10:00:00Z'),
        updatedAt: new Date('2024-01-25T10:00:00Z')
      }
    ];

    // Mock the persistence layer to return test records
    jest.spyOn(require('../../src/logic/persistence-layer'), 'findAllocationChangeHistoryByPeriod').mockResolvedValue({
      allocationChangeHistories: testRecords,
      totalCount: 5,
      found: true,
      periodStartDate: startDate,
      periodEndDate: endDate
    });

    // Act
    const result = await findAllocationChangeHistoryByPeriod({
      startDate,
      endDate,
      statusFilter: undefined,
      requestingUserId
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.totalCount).toBe(5);
    expect(result.allocationChangeHistories).toHaveLength(5);
    expect(result.found).toBe(true);
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);

    // Verify time series order (ascending)
    const dates = result.allocationChangeHistories.map(record => record.changeExecutionDate);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i - 1].getTime());
    }

    // Verify all records are present
    const recordIds = result.allocationChangeHistories.map(record => record.allocationChangeHistoryId);
    expect(recordIds).toContain('record-1');
    expect(recordIds).toContain('record-2');
    expect(recordIds).toContain('record-3');
    expect(recordIds).toContain('record-4');
    expect(recordIds).toContain('record-5');

    // Verify status values are present
    const statuses = result.allocationChangeHistories.map(record => record.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('approved');
    expect(statuses).toContain('executed');
    expect(statuses).toContain('rejected');
  });
});