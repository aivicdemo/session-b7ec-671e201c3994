import { listProductivityDataByCondition, ListProductivityDataByConditionInput, ListProductivityDataByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-965: 検索条件をすべて指定しない場合でも生産性データ一覧を取得する', () => {
  it('すべての検索条件フィールドが null または undefined の場合、全生産性データを取得できる', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: null,
      workResultIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workDateFrom: null,
      workDateTo: null,
      minProductivityRate: null,
      maxProductivityRate: null,
      minQualityScore: null,
      maxQualityScore: null,
      minErrorCount: null,
      maxErrorCount: null,
      proficiencyLevels: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listProductivityDataByCondition(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('productivityDataList');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('retrievedAt');

    expect(Array.isArray(result.productivityDataList)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
      expect(result.pageNumber).toBeGreaterThan(0);
    }

    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
      expect(result.pageSize).toBeGreaterThan(0);
    }

    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    result.productivityDataList.forEach((item) => {
      expect(item).toHaveProperty('productivityDataId');
      expect(item).toHaveProperty('workResultId');
      expect(item).toHaveProperty('workerId');
      expect(item).toHaveProperty('facilityId');
      expect(item).toHaveProperty('teamId');
      expect(item).toHaveProperty('workDate');
      expect(item).toHaveProperty('plannedWorkTime');
      expect(item).toHaveProperty('actualWorkTime');
      expect(item).toHaveProperty('completedItemCount');
      expect(item).toHaveProperty('productivityRate');
      expect(item).toHaveProperty('qualityScore');
      expect(item).toHaveProperty('errorCount');
      expect(item).toHaveProperty('proficiencyLevel');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('createdBy');

      expect(typeof item.productivityDataId).toBe('string');
      expect(typeof item.workResultId).toBe('string');
      expect(typeof item.workerId).toBe('string');
      expect(typeof item.facilityId).toBe('string');
      expect(typeof item.teamId).toBe('string');
      expect(typeof item.plannedWorkTime).toBe('number');
      expect(typeof item.actualWorkTime).toBe('number');
      expect(typeof item.completedItemCount).toBe('number');
      expect(typeof item.productivityRate).toBe('number');
      expect(typeof item.qualityScore).toBe('number');
      expect(typeof item.errorCount).toBe('number');
      expect(typeof item.proficiencyLevel).toBe('string');
    });
  });

  it('すべての検索条件フィールドが undefined の場合、全生産性データを取得できる', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listProductivityDataByCondition(input);

    expect(result.productivityDataList).toBeDefined();
    expect(Array.isArray(result.productivityDataList)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('検索条件フィールドを混在させた場合（一部 null、一部 undefined、一部省略）、全生産性データを取得できる', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: null,
      workResultIds: undefined,
      workerIds: null,
      facilityIds: undefined,
      teamIds: null,
      workDateFrom: undefined,
      workDateTo: null,
      minProductivityRate: undefined,
      maxProductivityRate: null,
      minQualityScore: undefined,
      maxQualityScore: null,
      minErrorCount: undefined,
      maxErrorCount: null,
      proficiencyLevels: undefined,
      createdFromDate: null,
      createdToDate: undefined,
      updatedFromDate: null,
      updatedToDate: undefined,
      sortBy: null,
      sortOrder: undefined,
      pageNumber: null,
      pageSize: undefined,
    };

    const result = await listProductivityDataByCondition(input);

    expect(result.productivityDataList).toBeDefined();
    expect(Array.isArray(result.productivityDataList)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it('retrievedAt は常に ISO 8601 形式の文字列である', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: null,
      workResultIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
    };

    const result = await listProductivityDataByCondition(input);

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(result.retrievedAt)).not.toThrow();
  });

  it('返された生産性データリストの各要素は必須フィールドを持つ', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: null,
      workResultIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
    };

    const result = await listProductivityDataByCondition(input);

    if (result.productivityDataList.length > 0) {
      result.productivityDataList.forEach((data) => {
        expect(data.productivityDataId).toBeDefined();
        expect(data.workResultId).toBeDefined();
        expect(data.workerId).toBeDefined();
        expect(data.facilityId).toBeDefined();
        expect(data.teamId).toBeDefined();
        expect(data.workDate).toBeDefined();
        expect(data.plannedWorkTime).toBeDefined();
        expect(data.actualWorkTime).toBeDefined();
        expect(data.completedItemCount).toBeDefined();
        expect(data.productivityRate).toBeDefined();
        expect(data.qualityScore).toBeDefined();
        expect(data.errorCount).toBeDefined();
        expect(data.proficiencyLevel).toBeDefined();
        expect(data.createdAt).toBeDefined();
        expect(data.updatedAt).toBeDefined();
        expect(data.createdBy).toBeDefined();
      });
    }
  });

  it('totalCount はデータベース内のすべての生産性データレコードの総件数を示す', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: null,
      workResultIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
    };

    const result = await listProductivityDataByCondition(input);

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    if (result.pageNumber === null || result.pageNumber === undefined) {
      expect(result.productivityDataList.length).toBeLessThanOrEqual(result.totalCount);
    }
  });

  it('エラーが発生しない状態で正常に完了する', async () => {
    const input: ListProductivityDataByConditionInput = {
      productivityDataIds: null,
      workResultIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
    };

    let errorOccurred = false;
    try {
      await listProductivityDataByCondition(input);
    } catch (error) {
      errorOccurred = true;
    }

    expect(errorOccurred).toBe(false);
  });
});