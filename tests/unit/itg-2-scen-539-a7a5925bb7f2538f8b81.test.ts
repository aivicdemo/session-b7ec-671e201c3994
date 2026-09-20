import { savePerformanceRecord } from '../../src/logic/persistence-layer';

describe('SCEN-539: savePerformanceRecord with negative completionCount', () => {
  it('should throw InvalidCompletionCountError when completionCount is negative', async () => {
    const testData = {
      performanceRecordId: 'perf-001',
      workerId: 'worker-123',
      placementPlanId: 'plan-456',
      workDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000),
      workContent: 'ピッキング作業',
      completionCount: -5,
      requiredTimeMinutes: 120,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(testData)).rejects.toThrow('完了数量 -5 は無効です。');
  });
});