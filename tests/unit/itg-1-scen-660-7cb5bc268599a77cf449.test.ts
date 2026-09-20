import { listProficienciesByCondition } from '../../src/logic/data-persistence';
import { ListProficienciesByConditionInput, ListProficienciesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-660: listProficienciesByConditionでソート順序を指定して習熟度データを取得', () => {
  test('sortBy=proficiencyId, sortOrder=ascで習熟度データが昇順に整列して返却される', async () => {
    const input: ListProficienciesByConditionInput = {
      sortBy: 'proficiencyId',
      sortOrder: 'asc',
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
      pageNumber: null,
      pageSize: null,
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    expect(result).toBeDefined();
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    if (result.proficiencies.length > 1) {
      for (let i = 0; i < result.proficiencies.length - 1; i++) {
        const current = result.proficiencies[i];
        const next = result.proficiencies[i + 1];

        const currentValue = current.proficiencyId;
        const nextValue = next.proficiencyId;

        expect(currentValue <= nextValue).toBe(true);
      }
    }

    result.proficiencies.forEach((proficiency) => {
      expect(proficiency.proficiencyId).toBeDefined();
      expect(typeof proficiency.proficiencyId).toBe('string');
      expect(proficiency.workerId).toBeDefined();
      expect(proficiency.jobType).toBeDefined();
      expect(proficiency.proficiencyLevel).toBeDefined();
      expect(proficiency.evaluationDate).toBeDefined();
      expect(proficiency.evaluatedBy).toBeDefined();
      expect(proficiency.createdAt).toBeDefined();
      expect(proficiency.updatedAt).toBeDefined();
      expect(proficiency.createdBy).toBeDefined();
    });
  });
});