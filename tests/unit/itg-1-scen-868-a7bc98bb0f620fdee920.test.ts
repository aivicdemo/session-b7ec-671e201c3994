import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-868: 出力に遅延フラグが含まれる', () => {
  it('遅延フラグを含むレコードが正常に返却される', async () => {
    // テストデータの準備
    const testInput: ListAllocationExecutionStatusByConditionInput = {
      delayFlagFilter: null,
      sortBy: 'delayFlag',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 100,
    };

    // 関数を呼び出す
    const result = await listAllocationExecutionStatusByCondition(testInput);

    // 結果の型検証
    expect(result).toBeDefined();
    expect(result.allocationExecutionStatuses).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatuses)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();

    // ISO8601形式の日時文字列であることを確認
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoRegex);

    // 配列の各要素が正常に設定されていることを確認
    const records = result.allocationExecutionStatuses;
    expect(records.length).toBeGreaterThan(0);

    // 遅延フラグがtrueのレコードが存在することを確認
    const delayedRecords = records.filter((record) => record.delayFlag === true);
    expect(delayedRecords.length).toBeGreaterThan(0);

    // すべてのレコードについて、出力型に定義されたフィールドが存在することを確認
    records.forEach((record: GetAllocationExecutionStatusByIdOutput) => {
      expect(record.allocationExecutionStatusId).toBeDefined();
      expect(typeof record.allocationExecutionStatusId).toBe('string');

      expect(record.allocationPlanId).toBeDefined();
      expect(typeof record.allocationPlanId).toBe('string');

      expect(record.workInstructionId).toBeDefined();
      expect(typeof record.workInstructionId).toBe('string');

      expect(record.workerId).toBeDefined();
      expect(typeof record.workerId).toBe('string');

      expect(record.facilityId).toBeDefined();
      expect(typeof record.facilityId).toBe('string');

      expect(record.teamId).toBeDefined();
      expect(typeof record.teamId).toBe('string');

      expect(record.allocationState).toBeDefined();
      expect(typeof record.allocationState).toBe('string');

      expect(record.plannedStartDateTime).toBeDefined();
      expect(typeof record.plannedStartDateTime).toBe('string');
      expect(record.plannedStartDateTime).toMatch(isoRegex);

      expect(record.plannedEndDateTime).toBeDefined();
      expect(typeof record.plannedEndDateTime).toBe('string');
      expect(record.plannedEndDateTime).toMatch(isoRegex);

      expect(record.progressRate).toBeDefined();
      expect(typeof record.progressRate).toBe('number');
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);

      expect(record.delayFlag).toBeDefined();
      expect(typeof record.delayFlag).toBe('boolean');

      expect(record.plannedWorkHours).toBeDefined();
      expect(typeof record.plannedWorkHours).toBe('number');

      expect(record.createdAt).toBeDefined();
      expect(typeof record.createdAt).toBe('string');
      expect(record.createdAt).toMatch(isoRegex);

      expect(record.updatedAt).toBeDefined();
      expect(typeof record.updatedAt).toBe('string');
      expect(record.updatedAt).toMatch(isoRegex);

      expect(record.createdBy).toBeDefined();
      expect(typeof record.createdBy).toBe('string');
    });

    // 遅延フラグがtrueのレコードについて、他のフィールドが正常に設定されていることを確認
    delayedRecords.forEach((record: GetAllocationExecutionStatusByIdOutput) => {
      expect(record.allocationExecutionStatusId).toMatch(/^[a-f0-9-]+$/i);
      expect(record.allocationState).toBeTruthy();
      expect(record.progressRate).toBeGreaterThanOrEqual(0);
      expect(record.progressRate).toBeLessThanOrEqual(100);

      // 実績情報は null でもundefinedでもよいが、定義されている場合は正しい形式であることを確認
      if (record.actualStartDateTime !== null && record.actualStartDateTime !== undefined) {
        expect(typeof record.actualStartDateTime).toBe('string');
        expect(record.actualStartDateTime).toMatch(isoRegex);
      }

      if (record.actualEndDateTime !== null && record.actualEndDateTime !== undefined) {
        expect(typeof record.actualEndDateTime).toBe('string');
        expect(record.actualEndDateTime).toMatch(isoRegex);
      }

      if (record.actualWorkHours !== null && record.actualWorkHours !== undefined) {
        expect(typeof record.actualWorkHours).toBe('number');
        expect(record.actualWorkHours).toBeGreaterThanOrEqual(0);
      }
    });

    // ページネーション情報の確認
    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
      expect(result.pageNumber).toBeGreaterThanOrEqual(1);
    }

    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
      expect(result.pageSize).toBeGreaterThanOrEqual(1);
    }
  });
});