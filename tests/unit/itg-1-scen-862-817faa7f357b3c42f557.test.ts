import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import type { ListAllocationExecutionStatusByConditionInput, ListAllocationExecutionStatusByConditionOutput, GetAllocationExecutionStatusByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-862: 人員配置実行状況データ全件取得', () => {
  test('ページング指定なしで全件を取得する', async () => {
    // Arrange: 入力条件を準備
    const input: ListAllocationExecutionStatusByConditionInput = {
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
      minActualWorkHours: undefined,
      maxActualWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act: 処理を実行
    const result = await listAllocationExecutionStatusByCondition(input);

    // Assert: 期待結果を検証

    // 戻り値が定義されていることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationExecutionStatuses');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('retrievedAt');

    // ページング指定がないため、pageNumber と pageSize は null または undefined
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // retrievedAt が ISO8601 形式のタイムスタンプであることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // allocationExecutionStatuses が配列であることを確認
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);

    // totalCount が0以上の整数であることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalCount)).toBe(true);

    // allocationExecutionStatuses の件数が totalCount と一致することを確認
    expect(result.allocationExecutionStatuses.length).toBe(result.totalCount);

    // 各要素が GetAllocationExecutionStatusByIdOutput 型として機能し、必須フィールドを含むことを確認
    result.allocationExecutionStatuses.forEach((status: GetAllocationExecutionStatusByIdOutput) => {
      expect(status).toHaveProperty('allocationExecutionStatusId');
      expect(typeof status.allocationExecutionStatusId).toBe('string');

      expect(status).toHaveProperty('allocationPlanId');
      expect(typeof status.allocationPlanId).toBe('string');

      expect(status).toHaveProperty('workInstructionId');
      expect(typeof status.workInstructionId).toBe('string');

      expect(status).toHaveProperty('workerId');
      expect(typeof status.workerId).toBe('string');

      expect(status).toHaveProperty('facilityId');
      expect(typeof status.facilityId).toBe('string');

      expect(status).toHaveProperty('teamId');
      expect(typeof status.teamId).toBe('string');

      expect(status).toHaveProperty('allocationState');
      expect(typeof status.allocationState).toBe('string');

      expect(status).toHaveProperty('plannedStartDateTime');
      expect(typeof status.plannedStartDateTime).toBe('string');

      expect(status).toHaveProperty('plannedEndDateTime');
      expect(typeof status.plannedEndDateTime).toBe('string');

      // 進捗率が 0～100 の数値であることを確認
      expect(status).toHaveProperty('progressRate');
      expect(typeof status.progressRate).toBe('number');
      expect(status.progressRate).toBeGreaterThanOrEqual(0);
      expect(status.progressRate).toBeLessThanOrEqual(100);

      // 遅延フラグが boolean であることを確認
      expect(status).toHaveProperty('delayFlag');
      expect(typeof status.delayFlag).toBe('boolean');

      // 計画工数・実績工数が存在することを確認
      expect(status).toHaveProperty('plannedWorkHours');
      expect(typeof status.plannedWorkHours).toBe('number');

      // 計画と実績のギャップを確認できるよう、実績工数が存在することを確認
      // actualWorkHours は null または number
      if (status.actualWorkHours !== null && status.actualWorkHours !== undefined) {
        expect(typeof status.actualWorkHours).toBe('number');
      }

      expect(status).toHaveProperty('createdAt');
      expect(status).toHaveProperty('updatedAt');
      expect(status).toHaveProperty('createdBy');
    });
  });
});