import { findProductivityDataBySiteAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-487: findProductivityDataBySiteAndPeriod - Access Control', () => {
  it('should throw UnauthorizedAccessError when requesting user lacks access permission to the site', async () => {
    const siteId = 'SITE-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'USER-999';

    try {
      await findProductivityDataBySiteAndPeriod({
        siteId,
        startDate,
        endDate,
        requestingUserId,
      });
      fail('Expected UnauthorizedAccessError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('UnauthorizedAccessError');
      expect(error.message).toBe('この拠点のデータへのアクセス権限がありません。');
    }
  });
});