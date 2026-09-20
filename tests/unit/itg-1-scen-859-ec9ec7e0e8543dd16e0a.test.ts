import { listAllocationExecutionStatusByCondition, saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-859: 実績開始日時でソートして取得する', () => {
  it('should return allocation execution statuses sorted by actualStartDateTime in ascending order', async () => {
    // Setup test data - prepare allocation execution status records with different actualStartDateTime values
    const testDataToSave = [
      {
        allocationExecutionStatusId: null,
        allocationPlanId: 'plan-001',
        workInstructionId: 'instr-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocationState: '進行中',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        actualWorkHours: 7.5,
        progressRate: 75,
        delayFlag: false,
        remarks: 'Test record A',
        createdBy: 'test-user',
      },
      {
        allocationExecutionStatusId: null,
        allocationPlanId: 'plan-002',
        workInstructionId: 'instr-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocationState: '進行中',
        plannedStartDateTime: '2024-01-10T06:30:00Z',
        plannedEndDateTime: '2024-01-10T16:30:00Z',
        actualStartDateTime: '2024-01-10T06:30:00Z',
        actualEndDateTime: '2024-01-10T16:00:00Z',
        plannedWorkHours: 8,
        actualWorkHours: 8,
        progressRate: 80,
        delayFlag: false,
        remarks: 'Test record B',
        createdBy: 'test-user',
      },
      {
        allocationExecutionStatusId: null,
        allocationPlanId: 'plan-003',
        workInstructionId: 'instr-003',
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocationState: '完了',
        plannedStartDateTime: '2024-01-20T14:15:00Z',
        plannedEndDateTime: '2024-01-20T22:15:00Z',
        actualStartDateTime: '2024-01-20T14:15:00Z',
        actualEndDateTime: '2024-01-20T22:45:00Z',
        plannedWorkHours: 6,
        actualWorkHours: 6,
        progressRate: 60,
        delayFlag: true,
        remarks: 'Test record C',
        createdBy: 'test-user',
      },
      {
        allocationExecutionStatusId: null,
        allocationPlanId: 'plan-004',
        workInstructionId: 'instr-004',
        workerId: 'worker-004',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocationState: '進行中',
        plannedStartDateTime: '2024-01-10T10:45:00Z',
        plannedEndDateTime: '2024-01-10T20:45:00Z',
        actualStartDateTime: '2024-01-10T10:45:00Z',
        actualEndDateTime: '2024-01-10T20:15:00Z',
        plannedWorkHours: 8,
        actualWorkHours: 8.5,
        progressRate: 85,
        delayFlag: false,
        remarks: 'Test record D',
        createdBy: 'test-user',
      },
    ];

    // Save test data to establish the records in the database
    const savedRecords: { [key: number]: string } = {};
    for (let i = 0; i < testDataToSave.length; i++) {
      const saveResult = await saveAllocationExecutionStatus(testDataToSave[i]);
      savedRecords[i] = saveResult.allocationExecutionStatusId;
    }

    // Call the function with sort parameters
    const result = await listAllocationExecutionStatusByCondition({
      sortBy: 'actualStartDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    });

    // Verify allocationExecutionStatuses array is returned
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // Verify the exact number of records returned
    expect(result.allocationExecutionStatuses.length).toBe(4);

    // Verify sort order: actualStartDateTime in ascending order with expected record mapping
    // Record B (status-002): 2024-01-10T06:30:00Z
    expect(result.allocationExecutionStatuses[0].actualStartDateTime).toBe(
      '2024-01-10T06:30:00Z'
    );
    expect(result.allocationExecutionStatuses[0].allocationExecutionStatusId).toBe(
      savedRecords[1]
    );

    // Record D (status-004): 2024-01-10T10:45:00Z
    expect(result.allocationExecutionStatuses[1].actualStartDateTime).toBe(
      '2024-01-10T10:45:00Z'
    );
    expect(result.allocationExecutionStatuses[1].allocationExecutionStatusId).toBe(
      savedRecords[3]
    );

    // Record A (status-001): 2024-01-15T08:00:00Z
    expect(result.allocationExecutionStatuses[2].actualStartDateTime).toBe(
      '2024-01-15T08:00:00Z'
    );
    expect(result.allocationExecutionStatuses[2].allocationExecutionStatusId).toBe(
      savedRecords[0]
    );

    // Record C (status-003): 2024-01-20T14:15:00Z
    expect(result.allocationExecutionStatuses[3].actualStartDateTime).toBe(
      '2024-01-20T14:15:00Z'
    );
    expect(result.allocationExecutionStatuses[3].allocationExecutionStatusId).toBe(
      savedRecords[2]
    );

    // Verify chronological ordering
    for (let i = 0; i < result.allocationExecutionStatuses.length - 1; i++) {
      const current = new Date(result.allocationExecutionStatuses[i].actualStartDateTime).getTime();
      const next = new Date(result.allocationExecutionStatuses[i + 1].actualStartDateTime).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    // Verify totalCount equals the number of records
    expect(result.totalCount).toBe(4);

    // Verify pagination info
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // Verify retrievedAt is valid ISO8601 format
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Verify retrievedAt is a valid date string
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate).toBeInstanceOf(Date);
    expect(isNaN(retrievedDate.getTime())).toBe(false);

    // Verify retrievedAt is not in the future
    const now = new Date();
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(now.getTime());
  });
});