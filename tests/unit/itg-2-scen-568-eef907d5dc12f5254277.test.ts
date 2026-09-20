import { findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-568: findPerformanceRecordsByWorkerAndPeriod - WorkerNotFound Error', () => {
  it('should return WorkerNotFound error when worker does not exist', async () => {
    const input = {
      workerId: 'worker-999',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      requestingUserId: 'user-001',
    };

    try {
      await findPerformanceRecordsByWorkerAndPeriod(input);
      fail('Expected WorkerNotFound error to be thrown');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      if (error instanceof Error) {
        expect(error.message).toContain('作業者が見つかりません。');
      }
    }
  });
});