import { findProductivityDataBySiteAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-486: findProductivityDataBySiteAndPeriod - InvalidPeriodError when startDate is after endDate', () => {
  it('should throw InvalidPeriodError when startDate is after endDate', async () => {
    const siteId = 'SITE-001';
    const startDate = new Date('2024-01-31');
    const endDate = new Date('2024-01-15');
    const requestingUserId = 'USER-123';

    await expect(
      findProductivityDataBySiteAndPeriod({
        siteId,
        startDate,
        endDate,
        requestingUserId,
      })
    ).rejects.toThrow(expect.objectContaining({
      message: '指定された期間が無効です。',
    }));
  });
});