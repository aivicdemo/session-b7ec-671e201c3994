import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-847: 計画開始日時の範囲で絞り込んで取得する', () => {
  it('should retrieve allocation execution status records filtered by plannedStartDateTime range', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
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
      plannedStartFromDateTime: '2024-01-01T08:00:00Z',
      plannedStartToDateTime: '2024-01-31T17:00:00Z',
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
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    result.allocationExecutionStatuses.forEach((status) => {
      const plannedStart = new Date(status.plannedStartDateTime);
      const rangeStart = new Date('2024-01-01T08:00:00Z');
      const rangeEnd = new Date('2024-01-31T17:00:00Z');

      expect(plannedStart.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
      expect(plannedStart.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());

      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);

      expect(typeof status.delayFlag).toBe('boolean');

      expect(status.plannedWorkHours).toBeDefined();
      expect(typeof status.plannedWorkHours).toBe('number');
    });

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toISOString()).toBeDefined();
  });
});