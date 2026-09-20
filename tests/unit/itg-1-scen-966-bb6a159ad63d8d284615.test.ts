import { listProductivityDataByCondition } from '../../src/logic/data-persistence';
import { ListProductivityDataByConditionInput, ListProductivityDataByConditionOutput, GetProductivityDataByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-966: ページネーション指定なしで生産性データをすべて取得する', () => {
  let mockProductivityDataList: GetProductivityDataByIdOutput[];

  beforeEach(() => {
    mockProductivityDataList = Array.from({ length: 100 }, (_, i) => (({
      productivityDataId: `prod-${i}`,
      workResultId: `result-${i}`,
      workerId: `worker-${i % 10}`,
      facilityId: `facility-${i % 5}`,
      teamId: `team-${i % 8}`,
      workDate: new Date(2024, 0, 15 - Math.floor(i / 20)).toISOString(),
      plannedWorkTime: 480,
      actualWorkTime: 450 + (i % 30),
      completedItemCount: 100 + (i % 50),
      productivityRate: 85 + (i % 15),
      qualityScore: 90 + (i % 10),
      errorCount: i % 5,
      proficiencyLevel: ['初級', '中級', '上級', 'エキスパート'][i % 4],
      remarks: i % 2 === 0 ? `productivity data ${i}` : undefined,
      createdAt: new Date(2024, 0, 10).toISOString(),
      updatedAt: new Date(2024, 0, 15).toISOString(),
      createdBy: 'user-system',
      updatedBy: i % 3 === 0 ? 'user-updater' : undefined,
    })) as GetProductivityDataByIdOutput));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ページネーション指定がない場合、すべての検索条件に合致する生産性データを全件返す', async () => {
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

    const result: ListProductivityDataByConditionOutput = await listProductivityDataByCondition(input);

    expect(result.productivityDataList).toHaveLength(100);
    expect(result.totalCount).toBe(100);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('pageNumberが null、pageSizeが null の場合も、すべてのデータを返す', async () => {
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

    const result: ListProductivityDataByConditionOutput = await listProductivityDataByCondition(input);

    expect(result.productivityDataList).toHaveLength(100);
    expect(result.totalCount).toBe(100);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('検索条件フィールドがすべて undefined の場合、エラーなく全件取得完了', async () => {
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

    await expect(listProductivityDataByCondition(input)).resolves.not.toThrow();
  });

  it('retrievedAt フィールドが ISO 8601 形式で返される', async () => {
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

    const result: ListProductivityDataByConditionOutput = await listProductivityDataByCondition(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });

  it('各生産性データレコードが GetProductivityDataByIdOutput 型の全必須フィールドを含み、フィールド値が妥当な範囲内', async () => {
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

    const result: ListProductivityDataByConditionOutput = await listProductivityDataByCondition(input);

    result.productivityDataList.forEach((record) => {
      expect(record).toHaveProperty('productivityDataId');
      expect(typeof record.productivityDataId).toBe('string');

      expect(record).toHaveProperty('workResultId');
      expect(typeof record.workResultId).toBe('string');

      expect(record).toHaveProperty('workerId');
      expect(typeof record.workerId).toBe('string');

      expect(record).toHaveProperty('facilityId');
      expect(typeof record.facilityId).toBe('string');

      expect(record).toHaveProperty('teamId');
      expect(typeof record.teamId).toBe('string');

      expect(record).toHaveProperty('workDate');
      expect(typeof record.workDate).toBe('string');

      expect(record).toHaveProperty('plannedWorkTime');
      expect(typeof record.plannedWorkTime).toBe('number');
      expect(record.plannedWorkTime).toBeGreaterThanOrEqual(0);

      expect(record).toHaveProperty('actualWorkTime');
      expect(typeof record.actualWorkTime).toBe('number');
      expect(record.actualWorkTime).toBeGreaterThanOrEqual(0);

      expect(record).toHaveProperty('completedItemCount');
      expect(typeof record.completedItemCount).toBe('number');
      expect(record.completedItemCount).toBeGreaterThanOrEqual(0);

      expect(record).toHaveProperty('productivityRate');
      expect(typeof record.productivityRate).toBe('number');
      expect(record.productivityRate).toBeGreaterThanOrEqual(0);
      expect(record.productivityRate).toBeLessThanOrEqual(100);

      expect(record).toHaveProperty('qualityScore');
      expect(typeof record.qualityScore).toBe('number');
      expect(record.qualityScore).toBeGreaterThanOrEqual(0);
      expect(record.qualityScore).toBeLessThanOrEqual(100);

      expect(record).toHaveProperty('errorCount');
      expect(typeof record.errorCount).toBe('number');
      expect(record.errorCount).toBeGreaterThanOrEqual(0);

      expect(record).toHaveProperty('proficiencyLevel');
      expect(typeof record.proficiencyLevel).toBe('string');
      expect(['初級', '中級', '上級', 'エキスパート']).toContain(record.proficiencyLevel);

      expect(record).toHaveProperty('createdAt');
      expect(typeof record.createdAt).toBe('string');

      expect(record).toHaveProperty('updatedAt');
      expect(typeof record.updatedAt).toBe('string');

      expect(record).toHaveProperty('createdBy');
      expect(typeof record.createdBy).toBe('string');

      if (record.remarks !== undefined) {
        expect(typeof record.remarks).toBe('string');
      }

      if (record.updatedBy !== undefined) {
        expect(typeof record.updatedBy).toBe('string');
      }
    });
  });

  it('totalCount が返却されるすべての生産性データレコードの実際の件数と一致する', async () => {
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

    const result: ListProductivityDataByConditionOutput = await listProductivityDataByCondition(input);

    expect(result.totalCount).toBe(result.productivityDataList.length);
  });
});