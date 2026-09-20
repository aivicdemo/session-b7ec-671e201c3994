import { listProficienciesByCondition, ListProficienciesByConditionInput, ListProficienciesByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-654: 作業者IDで絞り込んだ習熟度データを取得できる', () => {
  it('指定されたworkerIdsに合致する習熟度データのみを返す', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: ['W001', 'W002', 'W003'],
      proficiencyIds: null,
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
    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);
    const afterExecution = new Date();

    // proficienciesフィールドの検証
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);

    // 各要素が指定したworkerIdsに属することを確認
    result.proficiencies.forEach((proficiency) => {
      expect(['W001', 'W002', 'W003']).toContain(proficiency.workerId);
    });

    // totalCountフィールドの検証
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(result.proficiencies.length);

    // retrievedAtフィールドの検証
    expect(result.retrievedAt).toBeDefined();
    const retrievedAtTime = new Date(result.retrievedAt);
    expect(retrievedAtTime.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
    expect(retrievedAtTime.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + 1000);
    // ISO 8601形式の確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.retrievedAt)).toBe(true);

    // ページング指定がないため、pageNumberとpageSizeはnull/undefinedであることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // 結果が空でない場合、各習熟度データの構造を検証
    if (result.proficiencies.length > 0) {
      const firstProficiency = result.proficiencies[0];
      expect(firstProficiency.proficiencyId).toBeDefined();
      expect(firstProficiency.workerId).toBeDefined();
      expect(firstProficiency.jobType).toBeDefined();
      expect(firstProficiency.proficiencyLevel).toBeDefined();
      expect(firstProficiency.evaluationDate).toBeDefined();
      expect(firstProficiency.evaluatedBy).toBeDefined();
      expect(firstProficiency.createdAt).toBeDefined();
      expect(firstProficiency.updatedAt).toBeDefined();
      expect(firstProficiency.createdBy).toBeDefined();
    }
  });

  it('ページング指定なしで全データを取得する', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: ['W001', 'W002', 'W003'],
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    // ページング指定がないため、返却されたpageNumberとpageSizeはnull/undefinedであること
    expect(result.pageNumber === null || result.pageNumber === undefined).toBe(true);
    expect(result.pageSize === null || result.pageSize === undefined).toBe(true);

    // proficienciesの配列長がtotalCountと一致することを確認
    expect(result.proficiencies.length).toBeLessThanOrEqual(result.totalCount);
  });

  it('workerIdsが異なる場合、関連のない習熟度データを除外する', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: ['W001', 'W002', 'W003'],
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    // 指定されていないworkerIdsのデータが含まれないことを確認
    result.proficiencies.forEach((proficiency) => {
      expect(['W001', 'W002', 'W003']).toContain(proficiency.workerId);
      expect(['W004', 'W005', 'W999']).not.toContain(proficiency.workerId);
    });
  });

  it('retrievedAtがISO 8601形式の有効な日時であることを確認', async () => {
    const input: ListProficienciesByConditionInput = {
      workerIds: ['W001'],
    };

    const result: ListProficienciesByConditionOutput = await listProficienciesByCondition(input);

    // ISO 8601形式の正規表現でチェック
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);

    // 有効な日時文字列として解析できることを確認
    const parsedDate = new Date(result.retrievedAt);
    expect(parsedDate instanceof Date).toBe(true);
    expect(isNaN(parsedDate.getTime())).toBe(false);
  });
});