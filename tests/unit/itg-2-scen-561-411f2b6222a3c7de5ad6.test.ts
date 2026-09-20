import { findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-561: 指定された作業者と期間で実績レコードが存在し、アクセス権限がある場合、実績レコード一覧と総件数を返す', () => {
  it('should return performance records for specified worker and period when authorized', async () => {
    // Arrange
    const workerId = 'worker-001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-123';

    // Act
    const result = await findPerformanceRecordsByWorkerAndPeriod({
      workerId,
      startDate,
      endDate,
      requestingUserId,
    });

    // Assert
    expect(result.found).toBe(true);
    expect(Array.isArray(result.performanceRecords)).toBe(true);
    expect(result.performanceRecords.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.totalCount).toBe(result.performanceRecords.length);
    expect(result.workerId).toBe('worker-001');
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);

    // Verify each record structure
    result.performanceRecords.forEach((record) => {
      expect(record.performanceRecordId).toBeDefined();
      expect(record.workerId).toBe(workerId);
      expect(record.workDate).toBeDefined();
      expect(record.workContent).toBeDefined();
      expect(record.completionCount).toBeGreaterThanOrEqual(0);
      expect(record.requiredTimeMinutes).toBeGreaterThan(0);
      expect(record.qualityScore).toBeGreaterThanOrEqual(0);
      expect(record.qualityScore).toBeLessThanOrEqual(100);
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
    });
  });
});