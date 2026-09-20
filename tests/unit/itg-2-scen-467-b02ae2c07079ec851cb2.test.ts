import { findProductivityDataByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-467: 指定された作業者と期間で生産性レコードが存在する場合、検索条件に合致したレコード一覧と件数を返す', () => {
  it('should return productivity records matching the search criteria when records exist for the specified worker and period', async () => {
    // Arrange
    const workerId = 'W001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'U100';

    // Act
    const result = await findProductivityDataByWorkerAndPeriod({
      workerId,
      startDate,
      endDate,
      requestingUserId,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.productivityRecords).toBeDefined();
    expect(Array.isArray(result.productivityRecords)).toBe(true);
    expect(result.productivityRecords.length).toBeGreaterThanOrEqual(1);

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(result.productivityRecords.length);

    expect(result.found).toBe(true);

    expect(result.workerId).toBe('W001');
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);

    // Verify each record structure
    result.productivityRecords.forEach((record) => {
      expect(record.productivityDataId).toBeDefined();
      expect(record.performanceRecordId).toBeDefined();
      expect(record.workerId).toBe(workerId);
      expect(record.siteId).toBeDefined();
      expect(record.teamId).toBeDefined();
      expect(record.workDate).toBeDefined();
      expect(record.plannedWorkHours).toBeDefined();
      expect(record.actualWorkHours).toBeDefined();
      expect(record.completionCount).toBeDefined();
      expect(record.productivityRate).toBeDefined();
      expect(record.qualityScore).toBeDefined();
      expect(record.errorCount).toBeDefined();
      expect(record.proficiencyLevel).toBeDefined();
    });
  });
});