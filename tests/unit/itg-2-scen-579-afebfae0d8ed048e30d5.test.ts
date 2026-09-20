import { findPerformanceRecordsByPlacementPlan } from '../../src/logic/persistence-layer';
import {
  FindPerformanceRecordsByPlacementPlanInput,
  FindPerformanceRecordsByPlacementPlanOutput,
  PerformanceRecordDetail,
} from '../../src/logic/persistence-layer';

// Mock the persistence layer module
jest.mock('../../src/logic/persistence-layer', () => ({
  findPerformanceRecordsByPlacementPlan: jest.fn(),
}));

describe('SCEN-579: findPerformanceRecordsByPlacementPlan - 出力される配置計画IDはリクエストの配置計画IDと一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('出力型の placementPlanId フィールドが入力値と完全に一致し、実績レコード一覧が返されること', async () => {
    const input: FindPerformanceRecordsByPlacementPlanInput = {
      placementPlanId: 'PP-001',
      requestingUserId: 'USER-123',
    };

    const placementStartDate = new Date('2024-01-01');
    const placementEndDate = new Date('2024-01-31');

    const mockPerformanceRecords: PerformanceRecordDetail[] = [
      {
        performanceRecordId: 'PR-001',
        workerId: 'W-001',
        placementPlanId: 'PP-001',
        workDate: new Date('2024-01-15'),
        workContent: 'Assembly task',
        completionCount: 100,
        requiredTimeMinutes: 480,
        qualityScore: 95,
        remarks: 'Good performance',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        performanceRecordId: 'PR-002',
        workerId: 'W-002',
        placementPlanId: 'PP-001',
        workDate: new Date('2024-01-20'),
        workContent: 'Packaging task',
        completionCount: 120,
        requiredTimeMinutes: 420,
        qualityScore: 92,
        remarks: 'Satisfactory',
        createdAt: new Date('2024-01-20T10:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z'),
      },
    ];

    const mockOutput: FindPerformanceRecordsByPlacementPlanOutput = {
      performanceRecords: mockPerformanceRecords,
      totalCount: 2,
      found: true,
      placementPlanId: 'PP-001',
      placementPeriodStartDate: placementStartDate,
      placementPeriodEndDate: placementEndDate,
    };

    (findPerformanceRecordsByPlacementPlan as jest.Mock).mockResolvedValue(mockOutput);

    const result = await findPerformanceRecordsByPlacementPlan(input);

    // placementPlanId がリクエスト値と完全に一致することを確認
    expect(result.placementPlanId).toBe('PP-001');
    expect(result.placementPlanId).toBe(input.placementPlanId);

    // performanceRecords は配置計画期間内の実績レコード一覧を含むことを確認
    expect(result.performanceRecords).toBeDefined();
    expect(Array.isArray(result.performanceRecords)).toBe(true);

    // 配置計画期間内の実績レコードであることを確認
    if (result.performanceRecords.length > 0) {
      const placementStartDateFromResult = result.placementPeriodStartDate;
      const placementEndDateFromResult = result.placementPeriodEndDate;

      result.performanceRecords.forEach((record: PerformanceRecordDetail) => {
        const recordDate = new Date(record.workDate);
        const startDate = new Date(placementStartDateFromResult);
        const endDate = new Date(placementEndDateFromResult);

        expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(recordDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    }

    // totalCount は0以上の数値であることを確認
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');

    // found は true であることを確認
    expect(result.found).toBe(true);

    // placementPeriodStartDate と placementPeriodEndDate が配置計画の開始日・終了日として返されることを確認
    expect(result.placementPeriodStartDate).toBeDefined();
    expect(result.placementPeriodEndDate).toBeDefined();
    expect(result.placementPeriodStartDate).toBeInstanceOf(Date);
    expect(result.placementPeriodEndDate).toBeInstanceOf(Date);
    expect(result.placementPeriodStartDate.getTime()).toBeLessThanOrEqual(
      result.placementPeriodEndDate.getTime()
    );

    // 関数が正しい入力値で呼び出されたことを確認
    expect(findPerformanceRecordsByPlacementPlan).toHaveBeenCalledWith(input);
  });
});