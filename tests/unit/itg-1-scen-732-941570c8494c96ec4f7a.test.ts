import { listWorkResultsByCondition, ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-732: 作成日時の範囲で検索して合致するデータが返される', () => {
  it('should return work results matching the created date range', async () => {
    // Arrange: 入力パラメータを構築
    const createdFromDate = '2024-01-01T00:00:00Z';
    const createdToDate = '2024-01-31T23:59:59Z';

    const input: ListWorkResultsByConditionInput = {
      createdFromDate,
      createdToDate,
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
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
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act: listWorkResultsByCondition を実行
    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    // Assert: 戻り値を検証
    // 1. workResults は配列であること
    expect(Array.isArray(result.workResults)).toBe(true);

    // 2. 各要素は GetWorkResultByIdOutput 型の構造を持つこと
    result.workResults.forEach((workResult: GetWorkResultByIdOutput) => {
      expect(workResult).toHaveProperty('workResultId');
      expect(workResult).toHaveProperty('workInstructionId');
      expect(workResult).toHaveProperty('workerId');
      expect(workResult).toHaveProperty('facilityId');
      expect(workResult).toHaveProperty('teamId');
      expect(workResult).toHaveProperty('actualStartDateTime');
      expect(workResult).toHaveProperty('actualEndDateTime');
      expect(workResult).toHaveProperty('actualQuantity');
      expect(workResult).toHaveProperty('workStatus');
      expect(workResult).toHaveProperty('createdAt');
      expect(workResult).toHaveProperty('updatedAt');
    });

    // 3. totalCount フィールドは整数であること
    expect(typeof result.totalCount).toBe('number');
    expect(Number.isInteger(result.totalCount)).toBe(true);

    // 4. pageNumber フィールドは 1 であること
    expect(result.pageNumber).toBe(1);

    // 5. pageSize フィールドは 50 であること
    expect(result.pageSize).toBe(50);

    // 6. retrievedAt フィールドは ISO 8601 形式の日時文字列であること
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // 7. workResults 配列のサイズが正しいこと
    if (result.totalCount <= 50) {
      expect(result.workResults.length).toBe(result.totalCount);
    } else {
      expect(result.workResults.length).toBe(50);
    }

    // 8. workResults に含まれるすべてのレコードの作成日時が指定された範囲内にあること
    result.workResults.forEach((workResult: GetWorkResultByIdOutput) => {
      const createdAtTime = new Date(workResult.createdAt).getTime();
      const fromTime = new Date(createdFromDate).getTime();
      const toTime = new Date(createdToDate).getTime();

      expect(createdAtTime).toBeGreaterThanOrEqual(fromTime);
      expect(createdAtTime).toBeLessThanOrEqual(toTime);
    });
  });
});