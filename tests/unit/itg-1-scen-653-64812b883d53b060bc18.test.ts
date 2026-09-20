import { listProficienciesByCondition } from '../../src/logic/data-persistence';
import { ListProficienciesByConditionInput, ListProficienciesByConditionOutput, GetProficiencyByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-653: 習熟度IDで絞り込んだ習熟度データを取得できる', () => {
  it('指定された習熟度IDのみに一致するデータを返す', async () => {
    // 入力条件の準備
    const input: ListProficienciesByConditionInput = {
      proficiencyIds: ['PROF-001', 'PROF-002', 'PROF-003'],
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

    // テスト対象の公開処理を呼び出す
    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    // proficiencies フィールドが GetProficiencyByIdOutput 型の配列であることを確認
    expect(Array.isArray(result.proficiencies)).toBe(true);
    expect(result.proficiencies.length).toBeGreaterThan(0);

    // 返された proficiencies 配列の各要素が指定した proficiencyIds に一致することを確認
    const returnedProficiencyIds = result.proficiencies.map(p => p.proficiencyId);
    returnedProficiencyIds.forEach(id => {
      expect(['PROF-001', 'PROF-002', 'PROF-003']).toContain(id);
    });

    // 指定された3つの習熟度IDがすべて結果に含まれることを確認
    expect(returnedProficiencyIds).toEqual(expect.arrayContaining(['PROF-001', 'PROF-002', 'PROF-003']));

    // totalCount フィールドが習熟度IDで絞り込まれた結果の総件数として返されることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(3);
    expect(result.totalCount).toBe(returnedProficiencyIds.length);

    // retrievedAt フィールドが ISO 8601 形式の日時文字列として返されることを確認
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // 返されたデータ構造が GetProficiencyByIdOutput 型に合致することを確認
    result.proficiencies.forEach(proficiency => {
      expect(proficiency).toHaveProperty('proficiencyId');
      expect(proficiency).toHaveProperty('workerId');
      expect(proficiency).toHaveProperty('jobType');
      expect(proficiency).toHaveProperty('proficiencyLevel');
      expect(proficiency).toHaveProperty('evaluationDate');
      expect(proficiency).toHaveProperty('evaluatedBy');
      expect(proficiency).toHaveProperty('createdAt');
      expect(proficiency).toHaveProperty('updatedAt');
      expect(proficiency).toHaveProperty('createdBy');
    });
  });
});