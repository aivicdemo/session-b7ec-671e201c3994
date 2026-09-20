import { findProductivityDataByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-473: findProductivityDataByWorkerAndPeriod - Invalid period handling', () => {
  it('should throw InvalidPeriodError when startDate is after endDate', async () => {
    const workerId = 'worker-001';
    const requestingUserId = 'user-admin';
    const startDate = new Date('2024-01-10');
    const endDate = new Date('2024-01-05');

    const input = {
      workerId,
      startDate,
      endDate,
      requestingUserId,
    };

    await expect(
      findProductivityDataByWorkerAndPeriod(input)
    ).rejects.toMatchObject({
      name: 'InvalidPeriodError',
      message: expect.stringContaining('指定された期間が無効です。'),
    });
  });

  it('should not return productivityRecords when InvalidPeriodError is thrown', async () => {
    const workerId = 'worker-001';
    const requestingUserId = 'user-admin';
    const startDate = new Date('2024-01-10');
    const endDate = new Date('2024-01-05');

    const input = {
      workerId,
      startDate,
      endDate,
      requestingUserId,
    };

    try {
      await findProductivityDataByWorkerAndPeriod(input);
      fail('Expected InvalidPeriodError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidPeriodError');
      expect(error.productivityRecords).toBeUndefined();
      expect(error.totalCount).toBeUndefined();
      expect(error.found).toBeUndefined();
      expect(error.workerId).toBeUndefined();
      expect(error.periodStartDate).toBeUndefined();
      expect(error.periodEndDate).toBeUndefined();
    }
  });
});