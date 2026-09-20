import { savePerformanceRecord } from '../../src/logic/persistence-layer';

describe('SCEN-531: 作業者の実績記録保存時のエラーハンドリング', () => {
  describe('指定された作業者IDが存在しないときInvalidWorkerIdErrorが発生する', () => {
    it('存在しない作業者IDで実績記録を保存しようとすると、InvalidWorkerIdErrorがスローされる', async () => {
      const nonExistentWorkerId = 'worker-999';
      const testInput = {
        performanceRecordId: 'perf-001',
        workerId: nonExistentWorkerId,
        placementPlanId: 'plan-001',
        workDate: new Date(),
        workContent: 'テスト作業',
        completionCount: 10,
        requiredTimeMinutes: 480,
        qualityScore: 85,
        remarks: undefined,
        createdBy: 'user-001',
        updatedBy: undefined,
        requestingUserId: 'user-001',
        operation: 'create' as const,
      };

      await expect(savePerformanceRecord(testInput)).rejects.toThrow();
    });

    it('スローされるエラーの名前がInvalidWorkerIdErrorである', async () => {
      const nonExistentWorkerId = 'worker-999';
      const testInput = {
        performanceRecordId: 'perf-001',
        workerId: nonExistentWorkerId,
        placementPlanId: 'plan-001',
        workDate: new Date(),
        workContent: 'テスト作業',
        completionCount: 10,
        requiredTimeMinutes: 480,
        qualityScore: 85,
        remarks: undefined,
        createdBy: 'user-001',
        updatedBy: undefined,
        requestingUserId: 'user-001',
        operation: 'create' as const,
      };

      try {
        await savePerformanceRecord(testInput);
        fail('エラーがスローされるべきでした');
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.name).toBe('InvalidWorkerIdError');
        } else {
          fail('エラーオブジェクトが Error インスタンスではありません');
        }
      }
    });

    it('エラーメッセージが正確に一致する', async () => {
      const nonExistentWorkerId = 'worker-999';
      const testInput = {
        performanceRecordId: 'perf-001',
        workerId: nonExistentWorkerId,
        placementPlanId: 'plan-001',
        workDate: new Date(),
        workContent: 'テスト作業',
        completionCount: 10,
        requiredTimeMinutes: 480,
        qualityScore: 85,
        remarks: undefined,
        createdBy: 'user-001',
        updatedBy: undefined,
        requestingUserId: 'user-001',
        operation: 'create' as const,
      };

      const expectedMessage = '作業者ID worker-999 が見つからないか、稼働状態が無効です。';

      try {
        await savePerformanceRecord(testInput);
        fail('エラーがスローされるべきでした');
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toBe(expectedMessage);
        } else {
          fail('エラーオブジェクトが Error インスタンスではありません');
        }
      }
    });
  });
});