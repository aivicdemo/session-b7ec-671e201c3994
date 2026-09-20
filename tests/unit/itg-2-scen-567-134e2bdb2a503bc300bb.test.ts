import { findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-567: 検索期間の開始日と終了日が同じ場合', () => {
  it('その日付の実績レコードを返す', async () => {
    const workerId = 'worker-001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'user-001';

    const result = await findPerformanceRecordsByWorkerAndPeriod({
      workerId,
      startDate: targetDate,
      endDate: targetDate,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.workerId).toBe(workerId);
    expect(result.periodStartDate).toEqual(targetDate);
    expect(result.periodEndDate).toEqual(targetDate);
    expect(result.performanceRecords).toBeDefined();
    expect(Array.isArray(result.performanceRecords)).toBe(true);

    if (result.performanceRecords.length > 0) {
      result.performanceRecords.forEach((record) => {
        const recordDate = new Date(record.workDate);
        recordDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(targetDate);
        expectedDate.setHours(0, 0, 0, 0);
        expect(recordDate.getTime()).toBe(expectedDate.getTime());
      });
    }

    expect(result.totalCount).toBe(result.performanceRecords.length);
  });
});