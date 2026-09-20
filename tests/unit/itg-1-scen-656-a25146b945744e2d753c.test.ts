import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-656: 習熟度レベルで絞り込んだ習熟度データを取得できる', () => {
  it('should retrieve proficiencies filtered by proficiencyLevels', async () => {
    const input = {
      proficiencyLevels: ['Level1', 'Level2'],
      proficiencyIds: undefined,
      workerIds: undefined,
      jobTypes: undefined,
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

    const output = await listProficienciesByCondition(input);

    expect(output).toBeDefined();
    expect(output.proficiencies).toBeDefined();
    expect(Array.isArray(output.proficiencies)).toBe(true);

    output.proficiencies.forEach((proficiency) => {
      expect(input.proficiencyLevels).toContain(proficiency.proficiencyLevel);
    });

    expect(output.totalCount).toBe(output.proficiencies.length);

    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    expect(iso8601Regex.test(output.retrievedAt)).toBe(true);

    expect(output.pageNumber).toBeUndefined();
    expect(output.pageSize).toBeUndefined();
  });
});