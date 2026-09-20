import {
  listProficienciesByCondition,
  ListProficienciesByConditionInput,
  ListProficienciesByConditionOutput,
} from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-658', () => {
  describe('作成日範囲で絞り込んだ習熟度データを取得できる', () => {
    it('指定された作成日範囲内の習熟度データを取得し、検索条件に合致するレコードのみを返す', async () => {
      // Arrange
      const input: ListProficienciesByConditionInput = {
        createdFromDate: '2024-01-01',
        createdToDate: '2024-01-31',
      };

      // Act
      const result: ListProficienciesByConditionOutput =
        await listProficienciesByCondition(input);

      // Assert
      // 出力型が正常に返されることを確認
      expect(result).toBeDefined();
      expect(result.proficiencies).toBeDefined();
      expect(Array.isArray(result.proficiencies)).toBe(true);
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe('number');
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.retrievedAt).toBeDefined();

      // retrievedAt が ISO 8601 形式のタイムスタンプであることを確認
      const retrievedAtDate = new Date(result.retrievedAt);
      expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
      expect(retrievedAtDate.getTime()).toBeGreaterThan(Date.now() - 60000); // 1分以内

      // proficiencies 配列内のすべてのレコードについて、createdAt が指定範囲内であることを確認
      const rangeStart = new Date('2024-01-01').getTime();
      const rangeEnd = new Date('2024-01-31T23:59:59.999Z').getTime();

      result.proficiencies.forEach((proficiency) => {
        expect(proficiency.proficiencyId).toBeDefined();
        expect(typeof proficiency.proficiencyId).toBe('string');
        expect(proficiency.createdAt).toBeDefined();

        const createdAtTime = new Date(proficiency.createdAt).getTime();
        expect(createdAtTime).toBeGreaterThanOrEqual(rangeStart);
        expect(createdAtTime).toBeLessThanOrEqual(rangeEnd);
      });

      // totalCount が結果のレコード件数と整合性があることを確認
      expect(result.proficiencies.length).toBeLessThanOrEqual(result.totalCount);
    });

    it('作成日範囲で絞り込んだ際に、他のフィルタ条件が指定されていない場合、範囲内のすべての習熟度データを返す', async () => {
      // Arrange
      const input: ListProficienciesByConditionInput = {
        createdFromDate: '2024-01-01',
        createdToDate: '2024-01-31',
        proficiencyIds: undefined,
        workerIds: undefined,
        jobTypes: undefined,
        proficiencyLevels: undefined,
        evaluatedFromDate: undefined,
        evaluatedToDate: undefined,
        updatedFromDate: undefined,
        updatedToDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      };

      // Act
      const result: ListProficienciesByConditionOutput =
        await listProficienciesByCondition(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.proficiencies).toBeDefined();
      expect(Array.isArray(result.proficiencies)).toBe(true);

      // 結果に含まれるすべてのレコードの作成日が範囲内であることを確認
      const rangeStart = new Date('2024-01-01').getTime();
      const rangeEnd = new Date('2024-01-31T23:59:59.999Z').getTime();

      result.proficiencies.forEach((proficiency) => {
        const createdAtTime = new Date(proficiency.createdAt).getTime();
        expect(createdAtTime).toBeGreaterThanOrEqual(rangeStart);
        expect(createdAtTime).toBeLessThanOrEqual(rangeEnd);

        // 習熟度データの必須フィールドが存在することを確認
        expect(proficiency.proficiencyId).toBeDefined();
        expect(typeof proficiency.proficiencyId).toBe('string');
        expect(proficiency.workerId).toBeDefined();
        expect(typeof proficiency.workerId).toBe('string');
        expect(proficiency.jobType).toBeDefined();
        expect(typeof proficiency.jobType).toBe('string');
        expect(proficiency.proficiencyLevel).toBeDefined();
        expect(typeof proficiency.proficiencyLevel).toBe('string');
        expect(proficiency.evaluationDate).toBeDefined();
        expect(proficiency.evaluatedBy).toBeDefined();
        expect(proficiency.createdAt).toBeDefined();
        expect(proficiency.updatedAt).toBeDefined();
        expect(proficiency.createdBy).toBeDefined();
      });

      // totalCount が 0 以上の整数であることを確認
      expect(typeof result.totalCount).toBe('number');
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.totalCount)).toBe(true);

      // retrievedAt が ISO 8601 形式のタイムスタンプであることを確認
      const retrievedAtDate = new Date(result.retrievedAt);
      expect(retrievedAtDate instanceof Date).toBe(true);
      expect(isNaN(retrievedAtDate.getTime())).toBe(false);
    });

    it('作成日範囲内にレコードが存在しない場合、空配列と totalCount=0 を返す', async () => {
      // Arrange
      const input: ListProficienciesByConditionInput = {
        createdFromDate: '2099-01-01',
        createdToDate: '2099-12-31',
      };

      // Act
      const result: ListProficienciesByConditionOutput =
        await listProficienciesByCondition(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.proficiencies).toBeDefined();
      expect(Array.isArray(result.proficiencies)).toBe(true);
      expect(result.proficiencies.length).toBe(0);
      expect(result.totalCount).toBe(0);
      expect(result.retrievedAt).toBeDefined();

      const retrievedAtDate = new Date(result.retrievedAt);
      expect(isNaN(retrievedAtDate.getTime())).toBe(false);
    });
  });
});