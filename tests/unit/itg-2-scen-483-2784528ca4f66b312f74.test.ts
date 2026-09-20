import { findProductivityDataByTeamAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-483: findProductivityDataByTeamAndPeriod - 90日境界値テスト', () => {
  it('開始日と終了日が丁度90日離れているとき、正常に検索が完了する', async () => {
    const teamId = 'TEAM-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-03-31');
    const requestingUserId = 'USER-001';

    const result = await findProductivityDataByTeamAndPeriod({
      teamId,
      startDate,
      endDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.found).toBe(typeof result.found === 'boolean');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    expect(Array.isArray(result.productivityRecords)).toBe(true);
    expect(result.teamId).toBe('TEAM-001');
    expect(result.periodStartDate.getTime()).toBe(startDate.getTime());
    expect(result.periodEndDate.getTime()).toBe(endDate.getTime());

    if (result.found) {
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.productivityRecords.length).toBe(result.totalCount);
      result.productivityRecords.forEach((record) => {
        expect(record.productivityDataId).toBeDefined();
        expect(record.teamId).toBe('TEAM-001');
        expect(record.workDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(record.workDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    } else {
      expect(result.totalCount).toBe(0);
      expect(result.productivityRecords.length).toBe(0);
    }
  });
});