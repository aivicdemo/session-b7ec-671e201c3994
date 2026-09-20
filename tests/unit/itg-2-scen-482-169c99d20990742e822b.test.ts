import { findProductivityDataByTeamAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-482: findProductivityDataByTeamAndPeriod - Zero Results', () => {
  it('should return empty records array with count 0 and found false when no matching productivity data exists', async () => {
    const teamId = 'TEAM-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-15');
    const requestingUserId = 'USER-123';

    const result = await findProductivityDataByTeamAndPeriod({
      teamId,
      startDate,
      endDate,
      requestingUserId,
    });

    expect(result.productivityRecords).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.found).toBe(false);
    expect(result.teamId).toBe('TEAM-001');
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);
  });
});