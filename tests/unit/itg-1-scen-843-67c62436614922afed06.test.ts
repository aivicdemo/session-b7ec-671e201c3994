import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-843: チームIDで絞り込んで取得する', () => {
  it('should retrieve allocation execution status records filtered by teamIds only', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      teamIds: ['team-001', 'team-002'],
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
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

    result.allocationExecutionStatuses.forEach((record: GetAllocationExecutionStatusByIdOutput) => {
      expect(['team-001', 'team-002']).toContain(record.teamId);
      expect(record.allocationExecutionStatusId).toBeDefined();
      expect(record.allocationPlanId).toBeDefined();
      expect(record.workInstructionId).toBeDefined();
      expect(record.workerId).toBeDefined();
      expect(record.facilityId).toBeDefined();
      expect(record.teamId).toBeDefined();
      expect(record.allocationState).toBeDefined();
      expect(record.plannedStartDateTime).toBeDefined();
      expect(record.plannedEndDateTime).toBeDefined();
      expect(record.plannedWorkHours).toBeGreaterThanOrEqual(0);
      expect(typeof record.progressRate).toBe('number');
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);
      expect(typeof record.delayFlag).toBe('boolean');
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(record.createdBy).toBeDefined();
    });

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
    const retrievedDateTime = new Date(result.retrievedAt);
    expect(retrievedDateTime.getTime()).toBeGreaterThan(0);
  });
});