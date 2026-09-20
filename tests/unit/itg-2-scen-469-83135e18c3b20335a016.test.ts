import { findProductivityDataByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-469: findProductivityDataByWorkerAndPeriod - Invalid Period Error', () => {
  it('should throw InvalidPeriodError when start date is after end date', async () => {
    const workerId = 'worker-001';
    const requestingUserId = 'user-admin';
    const startDate = new Date('2024-01-31');
    const endDate = new Date('2024-01-01');

    await expect(
      findProductivityDataByWorkerAndPeriod({
        workerId,
        startDate,
        endDate,
        requestingUserId,
      })
    ).rejects.toThrow();

    try {
      await findProductivityDataByWorkerAndPeriod({
        workerId,
        startDate,
        endDate,
        requestingUserId,
      });
    } catch (error) {
      expect(error).toHaveProperty('message');
      expect((error as Error).message).toBe('指定された期間が無効です。');
    }
  });
});