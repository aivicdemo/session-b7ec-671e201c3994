import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-652: 検索条件指定なしで習熟度データ全件を取得できる', () => {
  it('検索条件指定なしで習熟度データ全件を取得し、出力型を検証する', async () => {
    const input = {
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProficienciesByCondition(input);

    expect(result).toBeDefined();
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(() => new Date(result.retrievedAt)).not.toThrow();

    if (result.proficiencies.length > 0) {
      result.proficiencies.forEach((proficiency) => {
        expect(proficiency).toBeDefined();
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