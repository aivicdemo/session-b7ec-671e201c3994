import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-663: 取得結果に総件数とデータ取得日時が含まれる', () => {
  it('should return ListProficienciesByConditionOutput with totalCount and retrievedAt when called with all null/undefined fields', async () => {
    const input = {
      proficiencyIds: null,
      workerIds: null,
      jobTypes: null,
      proficiencyLevels: null,
      evaluatedFromDate: null,
      evaluatedToDate: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const beforeExecution = new Date();
    const result = await listProficienciesByCondition(input);
    const afterExecution = new Date();

    expect(result).toBeDefined();
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);
    
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.toString()).not.toBe('Invalid Date');
    
    const retrievedTime = retrievedDate.getTime();
    const beforeTime = beforeExecution.getTime();
    const afterTime = afterExecution.getTime();
    
    const fiveSecondsInMs = 5000;
    expect(retrievedTime).toBeGreaterThanOrEqual(beforeTime - fiveSecondsInMs);
    expect(retrievedTime).toBeLessThanOrEqual(afterTime + fiveSecondsInMs);
    
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});