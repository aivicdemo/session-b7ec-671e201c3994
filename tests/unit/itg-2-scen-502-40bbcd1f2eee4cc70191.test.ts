import { findPlacementPlanByWorkerAndDate } from '../../src/logic/persistence-layer';

describe('findPlacementPlanByWorkerAndDate - SCEN-502', () => {
  it('should throw InvalidDateRangeエラー when targetDate is null', async () => {
    const workerId = 'W001';
    const targetDate = null as any;
    const requestingUserId = 'U001';

    await expect(
      findPlacementPlanByWorkerAndDate({
        workerId,
        targetDate,
        requestingUserId,
      })
    ).rejects.toThrow();

    try {
      await findPlacementPlanByWorkerAndDate({
        workerId,
        targetDate,
        requestingUserId,
      });
    } catch (error: any) {
      expect(error.message).toContain('日付形式が不正です');
      expect(error.name).toBe('InvalidDateRangeError');
      expect(error.stack).toContain('targetDate');
    }
  });
});