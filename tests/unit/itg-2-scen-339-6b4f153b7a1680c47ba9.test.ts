import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as initialAssignmentModule from '../../src/logic/initial-assignment-performance-analysis';

describe('SCEN-339: 初期割当実績が過去平均の80%以上かつエラー率が5%以下のとき習熟度段階がPROFICIENTと判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新配属者の実績データが条件を満たす場合、習熟度段階PROFICIENTが返される', async () => {
    const workerId = 'worker-001';
    const initialAssignmentId = 'assignment-001';
    const analysisStartDateTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = new Date();
    const requestingUserId = 'leader-001';

    // Mock internal dependencies
    const mockValidateInputData = jest.spyOn(initialAssignmentModule, 'validateInputData' as any).mockResolvedValue(true);
    const mockFindWorkerById = jest.spyOn(initialAssignmentModule, 'findWorkerById' as any).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      status: 'active',
    });
    const mockFindInitialAssignmentByWorker = jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      initialAssignmentId,
      workerId,
      assignmentStartDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
      assignmentStatus: 'active',
    });

    const mockPerformanceRecords = [
      {
        performanceRecordId: 'perf-001',
        workerId,
        workDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
        workContent: 'Assembly',
        completedQuantity: 85,
        workTimeMinutes: 100,
        qualityScore: 97,
      },
      {
        performanceRecordId: 'perf-002',
        workerId,
        workDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        workContent: 'Inspection',
        completedQuantity: 80,
        workTimeMinutes: 95,
        qualityScore: 96,
      },
      {
        performanceRecordId: 'perf-003',
        workerId,
        workDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        workContent: 'Packaging',
        completedQuantity: 90,
        workTimeMinutes: 105,
        qualityScore: 98,
      },
    ];

    const mockFindPerformanceRecordsByWorkerAndPeriod = jest
      .spyOn(initialAssignmentModule, 'findPerformanceRecordsByWorkerAndPeriod' as any)
      .mockResolvedValue(mockPerformanceRecords);

    // 初期割当実績: 平均生産性率85%、エラー率3%
    // 3レコードの平均: (85 + 84 + 86) / 3 = 85%
    // エラー率を3%にするため: 総エラー件数 = 8、総完了数 = 255 → 8/255 ≈ 3.14%
    const mockProductivityData = [
      {
        productivityDataId: 'prod-001',
        workerId,
        workDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
        planWorkTimeMinutes: 100,
        actualWorkTimeMinutes: 100,
        completedCount: 85,
        productivityRate: 85,
        qualityScore: 97,
        errorCount: 3,
      },
      {
        productivityDataId: 'prod-002',
        workerId,
        workDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        planWorkTimeMinutes: 95,
        actualWorkTimeMinutes: 95,
        completedCount: 80,
        productivityRate: 84,
        qualityScore: 96,
        errorCount: 3,
      },
      {
        productivityDataId: 'prod-003',
        workerId,
        workDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        planWorkTimeMinutes: 105,
        actualWorkTimeMinutes: 105,
        completedCount: 90,
        productivityRate: 86,
        qualityScore: 98,
        errorCount: 2,
      },
    ];

    const mockFindProductivityDataByWorkerAndPeriod = jest
      .spyOn(initialAssignmentModule, 'findProductivityDataByWorkerAndPeriod' as any)
      .mockResolvedValue(mockProductivityData);

    // 過去平均生産性率を100%として定義
    // 標準生産性率（過去平均）は100%として設定
    const mockWorkTypes = [
      {
        workTypeId: 'wt-001',
        workTypeName: 'Assembly',
        standardProductivityRate: 100,
        standardQualityScore: 95,
      },
      {
        workTypeId: 'wt-002',
        workTypeName: 'Inspection',
        standardProductivityRate: 100,
        standardQualityScore: 95,
      },
      {
        workTypeId: 'wt-003',
        workTypeName: 'Packaging',
        standardProductivityRate: 100,
        standardQualityScore: 95,
      },
    ];

    const mockFindWorkTypeById = jest.spyOn(initialAssignmentModule, 'findWorkTypeById' as any).mockImplementation((workTypeId) => {
      return Promise.resolve(mockWorkTypes.find((wt) => wt.workTypeId === workTypeId));
    });

    const mockSendInitialAssignmentPerformanceAnalysisToLeader = jest
      .spyOn(initialAssignmentModule, 'sendInitialAssignmentPerformanceAnalysisToLeader' as any)
      .mockResolvedValue({ success: true });

    const result = await analyzeInitialAssignmentPerformance({
      workerId,
      initialAssignmentId,
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.workerId).toBe(workerId);
    expect(result.initialAssignmentId).toBe(initialAssignmentId);

    expect(mockValidateInputData).toHaveBeenCalled();
    expect(mockFindWorkerById).toHaveBeenCalledWith(workerId);
    expect(mockFindInitialAssignmentByWorker).toHaveBeenCalledWith(workerId);
    expect(mockFindPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalledWith(workerId, analysisStartDateTime, analysisEndDateTime);
    expect(mockFindProductivityDataByWorkerAndPeriod).toHaveBeenCalledWith(workerId, analysisStartDateTime, analysisEndDateTime);
    expect(mockSendInitialAssignmentPerformanceAnalysisToLeader).toHaveBeenCalled();

    expect(result.proficiencyStage.stage).toBe('PROFICIENT');
    expect(result.proficiencyStage.stageDescription).toBeTruthy();
    expect(result.proficiencyStage.stageDescription.length).toBeGreaterThan(0);

    // 評価理由に計算根拠（初期割当85% ≥ 過去平均100% × 80%）とエラー率（3%）の根拠が記載されていることを検証
    expect(result.proficiencyStage.evaluationReason).toMatch(/初期割当.*85/);
    expect(result.proficiencyStage.evaluationReason).toMatch(/過去平均.*100/);
    expect(result.proficiencyStage.evaluationReason).toMatch(/80/);
    expect(result.proficiencyStage.evaluationReason).toMatch(/エラー率|error/i);
    expect(result.proficiencyStage.evaluationReason).toMatch(/3|3\.1|3\.14/);
    expect(result.proficiencyStage.evaluationReason).toMatch(/5/);
    
    expect(result.proficiencyStage.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(result.proficiencyStage.confidenceScore).toBeLessThanOrEqual(100);

    expect(result.aggregatedPerformanceData.averageProductivityRate).toBeCloseTo(85, 1);
    expect(result.aggregatedPerformanceData.totalCompletedQuantity).toBe(255);
    expect(result.aggregatedPerformanceData.totalWorkTimeMinutes).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.workTypeBreakdown.length).toBeGreaterThanOrEqual(3);

    const recommendedAction = result.difficultyAdjustmentRecommendation.recommendedAction;
    expect(['MAINTAIN_CURRENT', 'INCREASE_DIFFICULTY']).toContain(recommendedAction);

    expect(result.comparisonWithStandardPerformance.actualProductivityRate).toBeCloseTo(85, 1);
    expect(result.comparisonWithStandardPerformance.standardProductivityRate).toBe(100);
    expect(result.comparisonWithStandardPerformance.deviationPercentage).toBeCloseTo(-15, 1);

    // 正常範囲内のため、高リスクフラグが含まれていないことを検証
    if (result.riskFlags && result.riskFlags.length > 0) {
      const hasHighErrorFlag = result.riskFlags.some(
        (flag) => flag.riskType === 'HIGH_ERROR_RATE' && flag.severity === 'HIGH'
      );
      const hasLowProductivityFlag = result.riskFlags.some(
        (flag) => flag.riskType === 'LOW_PRODUCTIVITY' && flag.severity === 'HIGH'
      );
      expect(hasHighErrorFlag).toBe(false);
      expect(hasLowProductivityFlag).toBe(false);
    }

    expect(result.nextReviewSchedule).toBeInstanceOf(Date);
    expect(result.nextReviewSchedule.getTime()).toBeGreaterThan(analysisEndDateTime.getTime());

    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(Math.abs(result.analysisTimestamp.getTime() - Date.now())).toBeLessThan(5000);

    // 業務ルール br-tx_5-006: performanceRatio >= 0.8 && errorRate <= 0.05 を満たすPROFICIENT判定
    // performanceRatio = 初期割当実績の生産性率 / 過去平均の生産性率
    const performanceRatio = result.aggregatedPerformanceData.averageProductivityRate / result.comparisonWithStandardPerformance.standardProductivityRate;
    expect(performanceRatio).toBeCloseTo(0.85, 2);
    expect(performanceRatio).toBeGreaterThanOrEqual(0.8);
    
    // エラー率が3%（約0.03）以下であることを検証
    const totalCompletedQuantity = result.aggregatedPerformanceData.totalCompletedQuantity;
    const totalErrorCount = (mockProductivityData[0].errorCount + mockProductivityData[1].errorCount + mockProductivityData[2].errorCount);
    const errorRate = totalErrorCount / totalCompletedQuantity;
    expect(errorRate).toBeLessThanOrEqual(0.05);
    expect(errorRate).toBeCloseTo(0.03, 2);
  });
});