import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-721: 検索条件なしで作業実績一覧を取得すると、デフォルトページサイズで全件が返される', () => {
  it('should return work results with default page size when no search conditions are provided', async () => {
    // Step 1: ListWorkResultsByConditionInput を構成（全フィールド null/undefined）
    const input: ListWorkResultsByConditionInput = {
      workResultIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workStatuses: null,
      minActualQuantity: null,
      maxActualQuantity: null,
      minDefectCount: null,
      maxDefectCount: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Step 2: 関数を呼び出す
    const result = await listWorkResultsByCondition(input);

    // Step 3: 戻り値の型が ListWorkResultsByConditionOutput であることを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    // Step 4: workResults フィールドが配列型であることを確認
    expect(Array.isArray(result.workResults)).toBe(true);

    // Step 5: workResults 配列に GetWorkResultByIdOutput 型の要素が50件以下であることを確認
    expect(result.workResults.length).toBeLessThanOrEqual(50);
    result.workResults.forEach((item) => {
      expect(item).toHaveProperty('workResultId');
      expect(item).toHaveProperty('workInstructionId');
      expect(item).toHaveProperty('workerId');
      expect(item).toHaveProperty('facilityId');
      expect(item).toHaveProperty('teamId');
      expect(item).toHaveProperty('actualStartDateTime');
      expect(item).toHaveProperty('actualEndDateTime');
      expect(item).toHaveProperty('actualQuantity');
      expect(item).toHaveProperty('workStatus');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('createdBy');
    });

    // Step 6: totalCount フィールドが数値型であることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // Step 7: pageNumber フィールドが 1 であることを確認
    expect(result.pageNumber).toBe(1);

    // Step 8: pageSize フィールドが 50 であることを確認
    expect(result.pageSize).toBe(50);

    // Step 9: retrievedAt フィールドが ISO 8601 形式の文字列であることを確認
    expect(typeof result.retrievedAt).toBe('string');
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);

    // Step 10: workResults 配列の件数が、totalCount と pageSize の関係で整合していることを確認
    const expectedMaxItems = Math.min(result.pageSize, result.totalCount);
    const isLastPage = result.workResults.length < result.pageSize || 
                       (result.pageNumber * result.pageSize >= result.totalCount);
    if (isLastPage) {
      const expectedLastPageItems = result.totalCount - ((result.pageNumber - 1) * result.pageSize);
      expect(result.workResults.length).toBeLessThanOrEqual(expectedLastPageItems);
    } else {
      expect(result.workResults.length).toBe(result.pageSize);
    }
  });
});