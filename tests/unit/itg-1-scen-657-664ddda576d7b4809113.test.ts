import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-657: 評価日範囲で絞り込んだ習熟度データを取得できる', () => {
  it('should retrieve proficiency data filtered by evaluation date range', async () => {
    const evaluatedFromDate = '2024-01-01T00:00:00.000Z';
    const evaluatedToDate = '2024-01-31T23:59:59.999Z';

    const result = await listProficienciesByCondition({
      evaluatedFromDate,
      evaluatedToDate,
      proficiencyIds: undefined,
      workerIds: undefined,
      jobTypes: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result).toBeDefined();
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();

    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const evaluatedFromDateTime = new Date(evaluatedFromDate).getTime();
    const evaluatedToDateTime = new Date(evaluatedToDate).getTime();

    result.proficiencies.forEach((proficiency) => {
      const evaluationDateTime = new Date(proficiency.evaluationDate).getTime();
      expect(evaluationDateTime).toBeGreaterThanOrEqual(evaluatedFromDateTime);
      expect(evaluationDateTime).toBeLessThanOrEqual(evaluatedToDateTime);
    });

    expect(result.proficiencies.length).toBeLessThanOrEqual(result.totalCount);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.proficiencies.length);
  });
});