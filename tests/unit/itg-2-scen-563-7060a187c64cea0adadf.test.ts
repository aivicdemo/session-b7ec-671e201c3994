import { findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-563: 開始日が終了日より後の場合、InvalidPeriodエラーを返す', () => {
  it('startDateがendDateより後の場合、InvalidPeriodエラーを返す', async () => {
    const workerId = 'worker-001';
    const startDate = new Date('2024-01-31');
    const endDate = new Date('2024-01-01');
    const requestingUserId = 'user-123';

    const input = {
      workerId,
      startDate,
      endDate,
      requestingUserId,
    };

    try {
      await findPerformanceRecordsByWorkerAndPeriod(input);
      fail('InvalidPeriodエラーが発生すべきです');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.name).toBe('InvalidPeriod');
        expect(error.message).toBe(
          '期間の指定が無効です。開始日は終了日以前である必要があります。'
        );
      } else {
        fail('エラーがError型である必要があります');
      }
    }
  });
});