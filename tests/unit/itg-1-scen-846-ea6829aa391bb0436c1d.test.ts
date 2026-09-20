import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-846: 進捗率の範囲で絞り込んで取得する', () => {
  it('should retrieve allocation execution statuses filtered by progress rate range', async () => {
    const input = {
      minProgressRate: 40,
      maxProgressRate: 70,
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
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
      expect(status.progressRate).toBeGreaterThanOrEqual(40);
      expect(status.progressRate).toBeLessThanOrEqual(70);
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
      expect(status.delayFlag).toBeDefined();
      expect(typeof status.delayFlag).toBe('boolean');
      expect(status.createdAt).toBeDefined();
      expect(status.updatedAt).toBeDefined();
      expect(status.createdBy).toBeDefined();
    });

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(result.allocationExecutionStatuses.length);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    expect(result.retrievedAt).toBeDefined();
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.toString()).not.toBe('Invalid Date');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should return empty array when no data matches the progress rate range', async () => {
    const input = {
      minProgressRate: 95,
      maxProgressRate: 100,
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
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

    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should validate that progress rate range is within 0-100', async () => {
    const invalidInput = {
      minProgressRate: -10,
      maxProgressRate: 70,
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
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

    await expect(listAllocationExecutionStatusByCondition(invalidInput)).rejects.toThrow();
  });
});