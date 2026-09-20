import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-852: 実績工数の範囲で絞り込んで取得する', () => {
  it('minActualWorkHours=10、maxActualWorkHours=50のみを指定して検索し、合致する人員配置実行状況データを取得する', async () => {
    // テスト初期化
    const input: ListAllocationExecutionStatusByConditionInput = {
      minActualWorkHours: 10,
      maxActualWorkHours: 50,
      allocationExecutionStatusIds: undefined,
      allocationPlanIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      allocationStates: undefined,
      delayFlagFilter: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minPlannedWorkHours: undefined,
      maxPlannedWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // 実行
    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    // 戻り値の allocationExecutionStatuses フィールドを検証
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // 返却されたデータセット内のすべての人員配置実行状況について、
    // 入力条件の minActualWorkHours 以上 maxActualWorkHours 以下の範囲に合致していることを確認
    result.allocationExecutionStatuses.forEach((status) => {
      if (status.actualWorkHours !== null && status.actualWorkHours !== undefined) {
        expect(status.actualWorkHours).toBeGreaterThanOrEqual(input.minActualWorkHours!);
        expect(status.actualWorkHours).toBeLessThanOrEqual(input.maxActualWorkHours!);
      }
    });

    // 戻り値の totalCount フィールドを検証
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalCount)).toBe(true);
    // totalCount は実績工数範囲に合致するすべてのレコード件数と一致
    expect(result.totalCount).toBeGreaterThanOrEqual(
      result.allocationExecutionStatuses.length
    );

    // 戻り値の retrievedAt フィールドを検証
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO 8601形式の有効な日時文字列であることを確認
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.toString()).not.toBe('Invalid Date');
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.?\d*)?Z?$/
    );

    // ページング指定がないため pageNumber と pageSize は null または undefined であることを確認
    expect(
      result.pageNumber === null || result.pageNumber === undefined
    ).toBe(true);
    expect(result.pageSize === null || result.pageSize === undefined).toBe(
      true
    );
  });
});