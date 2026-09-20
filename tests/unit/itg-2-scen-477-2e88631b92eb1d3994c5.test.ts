import { findProductivityDataByTeamAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-477: findProductivityDataByTeamAndPeriod - InvalidPeriodError validation', () => {
  it('should throw InvalidPeriodError when startDate equals endDate', async () => {
    const teamId = 'TEAM-001';
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-15');
    const requestingUserId = 'USER-001';

    await expect(
      findProductivityDataByTeamAndPeriod({
        teamId,
        startDate,
        endDate,
        requestingUserId,
      })
    ).rejects.toThrow();

    try {
      await findProductivityDataByTeamAndPeriod({
        teamId,
        startDate,
        endDate,
        requestingUserId,
      });
      fail('Expected InvalidPeriodError to be thrown');
    } catch (error) {
      expect(error).toHaveProperty('name');
      expect((error as any).name).toBe('InvalidPeriodError');
      expect((error as any).message).toBe(
        '期間の開始日は終了日より前である必要があります。'
      );
    }
  });

  it('should throw InvalidPeriodError when startDate is after endDate', async () => {
    const teamId = 'TEAM-001';
    const startDate = new Date('2024-01-20');
    const endDate = new Date('2024-01-15');
    const requestingUserId = 'USER-001';

    try {
      await findProductivityDataByTeamAndPeriod({
        teamId,
        startDate,
        endDate,
        requestingUserId,
      });
      fail('Expected InvalidPeriodError to be thrown');
    } catch (error) {
      expect(error).toHaveProperty('name');
      expect((error as any).name).toBe('InvalidPeriodError');
      expect((error as any).message).toBe(
        '期間の開始日は終了日より前である必要があります。'
      );
    }
  });
});