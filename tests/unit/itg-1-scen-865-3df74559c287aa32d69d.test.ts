import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-865: 検索結果が0件の場合に空一覧を返す', () => {
  it('should return empty list when no allocation execution statuses match the search criteria', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationExecutionStatusIds: ['non-existent-id-001'],
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('should return empty list when search conditions produce no results', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      allocationPlanIds: ['non-existent-plan-id'],
      allocationStates: ['completed'],
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should preserve pagination info even when results are empty', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      workerIds: ['non-existent-worker'],
      pageNumber: 2,
      pageSize: 10,
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
  });

  it('should return empty list with retrieved timestamp in ISO8601 format', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: true,
      allocationStates: ['impossible-state'],
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoRegex);
  });

  it('should not throw error when filtering by non-existent facility and team', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      facilityIds: ['non-existent-facility-001'],
      teamIds: ['non-existent-team-001'],
    };

    const result = await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
  });
});