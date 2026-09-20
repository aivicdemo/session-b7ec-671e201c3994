import { findProductivityDataByTeamAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-475: findProductivityDataByTeamAndPeriod - チームの生産性レコード検索', () => {
  it('正常な入力でチームの生産性レコードが検索され、レコード配列と件数と存在フラグが返される', async () => {
    const teamId = 'TEAM-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-30');
    const requestingUserId = 'USER-123';

    const input = {
      teamId,
      startDate,
      endDate,
      requestingUserId,
    };

    const result = await findProductivityDataByTeamAndPeriod(input);

    expect(result.productivityRecords).toBeDefined();
    expect(Array.isArray(result.productivityRecords)).toBe(true);
    expect(result.productivityRecords.length).toBe(3);

    result.productivityRecords.forEach((record) => {
      expect(record).toHaveProperty('productivityDataId');
      expect(record).toHaveProperty('performanceRecordId');
      expect(record).toHaveProperty('workerId');
      expect(record).toHaveProperty('siteId');
      expect(record).toHaveProperty('teamId');
      expect(record).toHaveProperty('workDate');
      expect(record).toHaveProperty('plannedWorkHours');
      expect(record).toHaveProperty('actualWorkHours');
      expect(record).toHaveProperty('completionCount');
      expect(record).toHaveProperty('productivityRate');
      expect(record).toHaveProperty('qualityScore');
      expect(record).toHaveProperty('errorCount');
      expect(record).toHaveProperty('proficiencyLevel');
      expect(record).toHaveProperty('createdAt');
      expect(record).toHaveProperty('updatedAt');
    });

    expect(result.totalCount).toBe(3);
    expect(result.found).toBe(true);
    expect(result.teamId).toBe('TEAM-001');
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);
  });
});