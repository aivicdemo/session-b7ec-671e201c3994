import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-755: listWorkResultsByCondition - ページネーション デフォルト値適用', () => {
  it('ページネーション情報が指定されない場合、デフォルト値（ページ1、ページサイズ50）が適用される', async () => {
    // ステップ1: pageNumber と pageSize を指定しない入力を準備
    const inputWithoutPagination = {
      workerIds: undefined,
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // ステップ2-3: listWorkResultsByCondition を呼び出し
    const result = await listWorkResultsByCondition(inputWithoutPagination);

    // ステップ4: pageNumber フィールドを確認（デフォルト値 1 が適用されるはず）
    expect(result.pageNumber).toBe(1);

    // ステップ5: pageSize フィールドを確認（デフォルト値 50 が適用されるはず）
    expect(result.pageSize).toBe(50);

    // ステップ6: 返却された workResults 配列の件数がページサイズ 50 以下であることを確認
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults.length).toBeLessThanOrEqual(50);

    // 追加検証: totalCount には全レコード数が含まれていること
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');

    // retrievedAt には ISO 8601 形式の日時が設定されていること
    expect(result.retrievedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });

  it('pageNumber が null で指定される場合でも、デフォルト値 1 が適用される', async () => {
    const inputWithNullPageNumber = {
      workerIds: undefined,
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listWorkResultsByCondition(inputWithNullPageNumber);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.workResults.length).toBeLessThanOrEqual(50);
  });

  it('pageSize が null で指定される場合でも、デフォルト値 50 が適用される', async () => {
    const inputWithNullPageSize = {
      workerIds: undefined,
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: null,
    };

    const result = await listWorkResultsByCondition(inputWithNullPageSize);

    expect(result.pageSize).toBe(50);
    expect(result.pageNumber).toBe(1);
    expect(result.workResults.length).toBeLessThanOrEqual(50);
  });

  it('totalCount が全レコード数を正確に反映し、ページ1で最大50件が返却される', async () => {
    const input = {
      workerIds: undefined,
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listWorkResultsByCondition(input);

    // ページ1で返却されるレコード数は最大ページサイズ以下
    expect(result.workResults.length).toBeLessThanOrEqual(result.pageSize);

    // totalCount が返却レコード数以上か、正確な全体件数を表現
    if (result.workResults.length < result.pageSize) {
      // 最後のページまで到達した場合、返却件数が totalCount と一致
      expect(result.workResults.length).toBe(result.totalCount);
    } else {
      // まだページが続く場合、totalCount はページサイズ以上
      expect(result.totalCount).toBeGreaterThanOrEqual(result.pageSize);
    }
  });

  it('retrievedAt フィールドが有効な ISO 8601 形式で設定される', async () => {
    const input = {
      workerIds: undefined,
      workResultIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // ISO 8601 形式の検証
    const date = new Date(result.retrievedAt);
    expect(date instanceof Date && !isNaN(date.getTime())).toBe(true);
  });
});