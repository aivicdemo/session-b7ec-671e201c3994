import { listProgressDataByCondition, ListProgressDataByConditionInput, ListProgressDataByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-917: マッチする進捗データが0件の場合、空一覧と総件数0を返す', () => {
  it('すべての検索条件がnull/undefinedの場合、空配列と総件数0を返す', async () => {
    const input: ListProgressDataByConditionInput = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: null,
      progressDateTo: null,
      minCompletionRate: null,
      maxCompletionRate: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const beforeCall = new Date();
    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);
    const afterCall = new Date();

    expect(result.progressDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    const retrievedAtTime = new Date(result.retrievedAt);
    expect(retrievedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(retrievedAtTime.getTime()).toBeLessThanOrEqual(afterCall.getTime());

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('存在しないIDで検索した場合、空配列と総件数0を返す', async () => {
    const input: ListProgressDataByConditionInput = {
      progressDataIds: ['nonexistent-id-1', 'nonexistent-id-2'],
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(result.progressDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('日付範囲で検索してマッチがない場合、空配列と総件数0を返す', async () => {
    const input: ListProgressDataByConditionInput = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: '2099-01-01',
      progressDateTo: '2099-12-31',
      minCompletionRate: null,
      maxCompletionRate: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(result.progressDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('数値範囲で検索してマッチがない場合、空配列と総件数0を返す', async () => {
    const input: ListProgressDataByConditionInput = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: null,
      progressDateTo: null,
      minCompletionRate: 99,
      maxCompletionRate: 100,
      minActualQuantity: 100000,
      maxActualQuantity: 200000,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(result.progressDataList).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });

  it('retrievedAtがISO 8601形式で返される', async () => {
    const input: ListProgressDataByConditionInput = {
      progressDataIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      progressDateFrom: null,
      progressDateTo: null,
      minCompletionRate: null,
      maxCompletionRate: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDelayDays: null,
      maxDelayDays: null,
      delayFlagFilter: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListProgressDataByConditionOutput = await listProgressDataByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(() => new Date(result.retrievedAt).toISOString()).not.toThrow();
  });
});