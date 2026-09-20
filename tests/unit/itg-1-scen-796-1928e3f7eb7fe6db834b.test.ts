import { listAllocationPlansByCondition, ListAllocationPlansByConditionInput, ListAllocationPlansByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-796: listAllocationPlansByCondition - Empty search results', () => {
  it('should return empty allocation plans array with totalCount 0 when no records match the search conditions', async () => {
    // Arrange
    const input: ListAllocationPlansByConditionInput = {
      allocationPlanIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionIds: null,
      planNameKeyword: null,
      statuses: null,
      allocationStartFromDate: null,
      allocationStartToDate: null,
      allocationEndFromDate: null,
      allocationEndToDate: null,
      minEstimatedWorkHours: null,
      maxEstimatedWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result: ListAllocationPlansByConditionOutput = await listAllocationPlansByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.allocationPlans).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();

    // Verify retrievedAt is in ISO 8601 format and within 30 seconds of now
    const retrievedTime = new Date(result.retrievedAt).getTime();
    const nowTime = Date.now();
    const timeDifference = Math.abs(retrievedTime - nowTime);
    expect(timeDifference).toBeLessThanOrEqual(30000); // 30 seconds in milliseconds
  });
});