import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-857: 進捗率で降順にソートして取得する', () => {
  it('sortBy=progressRate、sortOrder=DESCで呼び出した場合、返却された配列が進捗率について降順にソートされていること', async () => {
    const input = {
      sortBy: 'progressRate',
      sortOrder: 'DESC',
      allocationExecutionStatusIds: null,
      allocationPlanIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      allocationStates: null,
      delayFlagFilter: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minPlannedWorkHours: null,
      maxPlannedWorkHours: null,
      minActualWorkHours: null,
      maxActualWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.allocationExecutionStatuses.length);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThan(0);

    if (result.allocationExecutionStatuses.length > 1) {
      for (let i = 0; i < result.allocationExecutionStatuses.length - 1; i++) {
        const current = result.allocationExecutionStatuses[i];
        const next = result.allocationExecutionStatuses[i + 1];

        expect(current.progressRate).toBeDefined();
        expect(next.progressRate).toBeDefined();
        expect(typeof current.progressRate).toBe('number');
        expect(typeof next.progressRate).toBe('number');

        expect(current.progressRate).toBeGreaterThanOrEqual(next.progressRate);
      }
    }

    for (const status of result.allocationExecutionStatuses) {
      expect(status.allocationExecutionStatusId).toBeDefined();
      expect(status.allocationPlanId).toBeDefined();
      expect(status.workInstructionId).toBeDefined();
      expect(status.workerId).toBeDefined();
      expect(status.facilityId).toBeDefined();
      expect(status.teamId).toBeDefined();
      expect(status.allocationState).toBeDefined();
      expect(status.plannedStartDateTime).toBeDefined();
      expect(status.plannedEndDateTime).toBeDefined();
      expect(status.plannedWorkHours).toBeDefined();
      expect(status.progressRate).toBeDefined();
      expect(typeof status.progressRate).toBe('number');
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);
      expect(status.delayFlag).toBeDefined();
      expect(typeof status.delayFlag).toBe('boolean');
      expect(status.createdAt).toBeDefined();
      expect(status.updatedAt).toBeDefined();
      expect(status.createdBy).toBeDefined();
    }
  });
});