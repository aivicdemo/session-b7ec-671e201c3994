import { listProficienciesByCondition, ListProficienciesByConditionInput, ListProficienciesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-671: listProficienciesByCondition - 検索条件に合致するデータが0件の場合', () => {
  it('should return empty array and totalCount 0 when no data matches search conditions', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: ['nonexistent-worker-001'],
      proficiencyIds: undefined,
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: '2099-01-01',
      evaluatedToDate: '2099-12-31',
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    expect(result).toBeDefined();
    expect(result.proficiencies).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoRegex);
  });

  it('should return empty array when searching with non-existent jobTypes', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: undefined,
      proficiencyIds: undefined,
      jobTypes: ['nonexistent-job-type-xyz'],
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    expect(result.proficiencies).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should return empty array when date range is outside available data', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: undefined,
      proficiencyIds: undefined,
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: '2050-01-01',
      evaluatedToDate: '2050-12-31',
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    expect(result.proficiencies).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
  });

  it('should maintain pagination parameters even with zero results', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: ['nonexistent-worker-002'],
      proficiencyIds: undefined,
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 5,
      pageSize: 20,
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    expect(result.proficiencies).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(5);
    expect(result.pageSize).toBe(20);
  });

  it('should have no error and return valid timestamp with empty results', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: undefined,
      proficiencyIds: ['nonexistent-proficiency-001'],
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    expect(result).toBeDefined();
    expect(result.proficiencies).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeTruthy();
    const timestamp = new Date(result.retrievedAt);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });
});