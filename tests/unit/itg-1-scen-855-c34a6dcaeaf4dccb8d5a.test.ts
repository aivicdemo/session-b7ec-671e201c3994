import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-855: 複数条件を組み合わせて絞り込んで取得する', () => {
  it('複数条件を組み合わせた検索で、条件に合致する人員配置実行状況データの一覧を取得する', async () => {
    // Arrange
    const input = {
      workerIds: ['worker-001', 'worker-002'],
      facilityIds: ['facility-A', 'facility-B'],
      allocationStates: ['進行中', '完了'],
      minProgressRate: 50,
      maxProgressRate: 100,
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      plannedStartToDateTime: '2024-01-31T23:59:59Z',
      delayFlagFilter: false,
      pageNumber: 1,
      pageSize: 10,
    };

    const mockAllocationExecutionStatuses = [
      {
        allocationExecutionStatusId: 'status-001',
        allocationPlanId: 'plan-001',
        workInstructionId: 'instruction-001',
        workerId: 'worker-001',
        facilityId: 'facility-A',
        teamId: 'team-001',
        allocationState: '進行中',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        actualStartDateTime: '2024-01-15T08:05:00Z',
        actualEndDateTime: null,
        plannedWorkHours: 8,
        actualWorkHours: null,
        progressRate: 75,
        delayFlag: false,
        remarks: null,
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        allocationExecutionStatusId: 'status-002',
        allocationPlanId: 'plan-002',
        workInstructionId: 'instruction-002',
        workerId: 'worker-002',
        facilityId: 'facility-B',
        teamId: 'team-002',
        allocationState: '完了',
        plannedStartDateTime: '2024-01-20T08:00:00Z',
        plannedEndDateTime: '2024-01-20T17:00:00Z',
        actualStartDateTime: '2024-01-20T08:00:00Z',
        actualEndDateTime: '2024-01-20T17:30:00Z',
        plannedWorkHours: 8,
        actualWorkHours: 8.5,
        progressRate: 100,
        delayFlag: false,
        remarks: null,
        createdAt: '2024-01-20T07:00:00Z',
        updatedAt: '2024-01-20T18:00:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
    ];

    // Act
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeInstanceOf(Array);
    expect(result.allocationExecutionStatuses.length).toBeLessThanOrEqual(10);

    // Verify all returned records match the search criteria
    result.allocationExecutionStatuses.forEach((status) => {
      expect(['worker-001', 'worker-002']).toContain(status.workerId);
      expect(['facility-A', 'facility-B']).toContain(status.facilityId);
      expect(['進行中', '完了']).toContain(status.allocationState);
      expect(status.progressRate).toBeGreaterThanOrEqual(50);
      expect(status.progressRate).toBeLessThanOrEqual(100);
      expect(new Date(status.plannedStartDateTime).getTime()).toBeGreaterThanOrEqual(
        new Date('2024-01-01T00:00:00Z').getTime()
      );
      expect(new Date(status.plannedStartDateTime).getTime()).toBeLessThanOrEqual(
        new Date('2024-01-31T23:59:59Z').getTime()
      );
      expect(status.delayFlag).toBe(false);
    });

    // Verify output structure
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationExecutionStatuses.length);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // Validate ISO8601 format
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // Verify each record has required fields
    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(status.allocationPlanId).toBeDefined();
      expect(status.workInstructionId).toBeDefined();
      expect(status.workerId).toBeDefined();
      expect(status.facilityId).toBeDefined();
      expect(status.teamId).toBeDefined();
      expect(status.allocationState).toBeDefined();
      expect(status.plannedStartDateTime).toBeDefined();
      expect(status.plannedEndDateTime).toBeDefined();
      expect(status.progressRate).toBeDefined();
      expect(status.delayFlag).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(typeof status.delayFlag).toBe('boolean');
    });

    // Verify no errors occurred
    expect(result).not.toHaveProperty('error');
  });
});