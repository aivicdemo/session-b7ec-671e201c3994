import { listProficienciesByCondition } from '../../src/logic/data-persistence';
import { ListProficienciesByConditionInput, ListProficienciesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-661: ページネーション条件に基づいて習熟度データを取得できる', () => {
  it('should retrieve proficiency data with pagination parameters', async () => {
    const input: ListProficienciesByConditionInput = {
      proficiencyIds: undefined,
      workerIds: undefined,
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
      pageNumber: 2,
      pageSize: 10,
    };

    const output = await listProficienciesByCondition(input);

    expect(output).toBeDefined();
    expect(output.proficiencies).toBeInstanceOf(Array);
    expect(output.proficiencies.length).toBeLessThanOrEqual(10);
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    expect(output.pageNumber).toBe(2);
    expect(output.pageSize).toBe(10);
    expect(typeof output.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.retrievedAt)).toBe(true);

    if (output.proficiencies.length > 0) {
      output.proficiencies.forEach((proficiency) => {
        expect(proficiency.proficiencyId).toBeDefined();
        expect(typeof proficiency.proficiencyId).toBe('string');
        expect(proficiency.workerId).toBeDefined();
        expect(typeof proficiency.workerId).toBe('string');
        expect(proficiency.jobType).toBeDefined();
        expect(typeof proficiency.jobType).toBe('string');
        expect(proficiency.proficiencyLevel).toBeDefined();
        expect(typeof proficiency.proficiencyLevel).toBe('string');
        expect(proficiency.evaluationDate).toBeDefined();
        expect(typeof proficiency.evaluationDate).toBe('string');
        expect(proficiency.evaluatedBy).toBeDefined();
        expect(typeof proficiency.evaluatedBy).toBe('string');
        expect(proficiency.createdAt).toBeDefined();
        expect(typeof proficiency.createdAt).toBe('string');
        expect(proficiency.updatedAt).toBeDefined();
        expect(typeof proficiency.updatedAt).toBe('string');
        expect(proficiency.createdBy).toBeDefined();
        expect(typeof proficiency.createdBy).toBe('string');
      });
    }
  });
});