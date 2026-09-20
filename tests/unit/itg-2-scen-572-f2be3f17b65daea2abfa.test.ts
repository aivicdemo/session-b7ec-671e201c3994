import { findPerformanceRecordsByPlacementPlan } from '../../src/logic/persistence-layer';

describe('SCEN-572: 指定された配置計画IDに紐づく実績レコード検索', () => {
  it('配置計画IDに紐づく実績レコードが存在する場合、作業者別・日付別の実績データと配置計画期間情報を取得できる', async () => {
    const placementPlanId = 'plan-001';
    const requestingUserId = 'user-123';

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const expectedPerformanceRecords = [
      {
        performanceRecordId: 'perf-001',
        workerId: 'worker-001',
        placementPlanId: 'plan-001',
        workDate: new Date('2024-01-05'),
        workContent: 'ピッキング作業',
        completionCount: 150,
        requiredTimeMinutes: 480,
        qualityScore: 95,
        remarks: '品質良好',
        createdAt: new Date('2024-01-05T10:00:00Z'),
        updatedAt: new Date('2024-01-05T10:00:00Z'),
      },
      {
        performanceRecordId: 'perf-002',
        workerId: 'worker-002',
        placementPlanId: 'plan-001',
        workDate: new Date('2024-01-06'),
        workContent: '梱包作業',
        completionCount: 120,
        requiredTimeMinutes: 420,
        qualityScore: 90,
        remarks: null,
        createdAt: new Date('2024-01-06T10:00:00Z'),
        updatedAt: new Date('2024-01-06T10:00:00Z'),
      },
    ];

    const result = await findPerformanceRecordsByPlacementPlan({
      placementPlanId,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.performanceRecords).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.placementPlanId).toBe('plan-001');
    expect(result.placementPeriodStartDate).toEqual(startDate);
    expect(result.placementPeriodEndDate).toEqual(endDate);

    result.performanceRecords.forEach((record) => {
      expect(record.performanceRecordId).toBeDefined();
      expect(record.workerId).toBeDefined();
      expect(record.placementPlanId).toBe('plan-001');
      expect(record.workDate).toBeInstanceOf(Date);
      expect(record.workContent).toBeDefined();
      expect(record.completionCount).toBeGreaterThan(0);
      expect(record.requiredTimeMinutes).toBeGreaterThan(0);
      expect(record.qualityScore).toBeGreaterThanOrEqual(0);
      expect(record.qualityScore).toBeLessThanOrEqual(100);
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });

    expect(result.performanceRecords[0].workerId).toBe('worker-001');
    expect(result.performanceRecords[0].workDate).toEqual(new Date('2024-01-05'));
    expect(result.performanceRecords[1].workerId).toBe('worker-002');
    expect(result.performanceRecords[1].workDate).toEqual(new Date('2024-01-06'));
  });
});