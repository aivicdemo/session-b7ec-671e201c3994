import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-841', () => {
  describe('listAllocationExecutionStatusByCondition', () => {
    it('作業者IDで絞り込んで取得する', async () => {
      // 入力値の定義
      const input: ListAllocationExecutionStatusByConditionInput = {
        workerIds: ['WORKER-001'],
      };

      // テスト対象の処理を呼び出す
      const output: ListAllocationExecutionStatusByConditionOutput =
        await listAllocationExecutionStatusByCondition(input);

      // 出力が正しい型であることを確認
      expect(output).toBeDefined();
      expect(output.allocationExecutionStatuses).toBeDefined();
      expect(Array.isArray(output.allocationExecutionStatuses)).toBe(true);

      // totalCount が0以上の整数であることを確認
      expect(output.totalCount).toBeDefined();
      expect(typeof output.totalCount).toBe('number');
      expect(output.totalCount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(output.totalCount)).toBe(true);

      // retrievedAt が ISO8601 形式の日時文字列であることを確認
      expect(output.retrievedAt).toBeDefined();
      expect(typeof output.retrievedAt).toBe('string');
      const isoDateRegex =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(isoDateRegex.test(output.retrievedAt)).toBe(true);

      // ページング情報が null または undefined であることを確認
      expect(
        output.pageNumber === null || output.pageNumber === undefined
      ).toBe(true);
      expect(output.pageSize === null || output.pageSize === undefined).toBe(
        true
      );

      // 取得した allocationExecutionStatuses 配列の各要素について検証
      output.allocationExecutionStatuses.forEach(
        (status: GetAllocationExecutionStatusByIdOutput) => {
          // 各要素が正しい型であることを確認
          expect(status.allocationExecutionStatusId).toBeDefined();
          expect(typeof status.allocationExecutionStatusId).toBe('string');

          expect(status.workerId).toBeDefined();
          expect(typeof status.workerId).toBe('string');

          // 指定した workerIds に該当する作業者のみが含まれることを確認
          expect(input.workerIds).toContain(status.workerId);

          // 必須フィールドが存在することを確認
          expect(status.allocationPlanId).toBeDefined();
          expect(status.workInstructionId).toBeDefined();
          expect(status.facilityId).toBeDefined();
          expect(status.teamId).toBeDefined();
          expect(status.allocationState).toBeDefined();
          expect(status.plannedStartDateTime).toBeDefined();
          expect(status.plannedEndDateTime).toBeDefined();
          expect(status.plannedWorkHours).toBeDefined();
          expect(status.progressRate).toBeDefined();
          expect(status.delayFlag).toBeDefined();
          expect(status.createdAt).toBeDefined();
          expect(status.updatedAt).toBeDefined();
          expect(status.createdBy).toBeDefined();

          // 型の確認
          expect(typeof status.progressRate).toBe('number');
          expect(typeof status.delayFlag).toBe('boolean');
          expect(typeof status.plannedWorkHours).toBe('number');

          // 進捗率が 0-100 の範囲であることを確認
          expect(status.progressRate).toBeGreaterThanOrEqual(0);
          expect(status.progressRate).toBeLessThanOrEqual(100);

          // 計画開始日時が計画終了日時より前であることを確認
          const startTime = new Date(status.plannedStartDateTime).getTime();
          const endTime = new Date(status.plannedEndDateTime).getTime();
          expect(startTime).toBeLessThan(endTime);
        }
      );

      // 指定した workerIds に一致しない作業者が含まれていないことを確認
      const workerIdsInResult = new Set(
        output.allocationExecutionStatuses.map((s) => s.workerId)
      );
      workerIdsInResult.forEach((workerId) => {
        expect(input.workerIds).toContain(workerId);
      });
    });
  });
});