import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-842: 拠点IDで絞り込んで取得する', () => {
  it('should retrieve allocation execution status records filtered by facility IDs', async () => {
    const input = {
      facilityIds: ['facility-001', 'facility-002'],
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minPlannedWorkHours: undefined,
      maxPlannedWorkHours: undefined,
      minActualWorkHours: undefined,
      maxActualWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    result.allocationExecutionStatuses.forEach((status) => {
      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(typeof status.allocationExecutionStatusId).toBe('string');
      expect(status.facilityId).toBeDefined();
      expect(['facility-001', 'facility-002']).toContain(status.facilityId);
      expect(status.progressRate).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);
      expect(status.delayFlag).toBeDefined();
      expect(typeof status.delayFlag).toBe('boolean');
      expect(status.plannedStartDateTime).toBeDefined();
      expect(typeof status.plannedStartDateTime).toBe('string');
      expect(status.plannedEndDateTime).toBeDefined();
      expect(typeof status.plannedEndDateTime).toBe('string');
    });

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(isoRegex);
  });
});