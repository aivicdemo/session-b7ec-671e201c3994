import { findAllocationChangeHistoryByPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-657: findAllocationChangeHistoryByPeriod', () => {
  it('should throw InvalidPeriodRangeError when startDate is after endDate', async () => {
    const startDate = new Date('2024-01-31');
    const endDate = new Date('2024-01-01');
    const statusFilter = undefined;
    const requestingUserId = 'user-001';

    await expect(
      findAllocationChangeHistoryByPeriod({
        startDate,
        endDate,
        statusFilter,
        requestingUserId,
      })
    ).rejects.toMatchObject({
      name: 'InvalidPeriodRangeError',
      message: '期間の開始日は終了日以前である必要があります。',
    });
  });
});