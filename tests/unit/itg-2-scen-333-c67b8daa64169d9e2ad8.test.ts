import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as performanceModule from '../../src/logic/initial-assignment-performance-analysis';

describe('SCEN-333: 新配属者の習熟度段階と難度調整案の生成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('代表的な正常入力で新配属者の習熟度段階と難度調整案が生成される', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const workerId = 'WK001';
    const initialAssignmentId = 'IA-20250115-001';
    const requestingUserId = 'LDR001';

    // Mock findWorkerById
    const findWorkerByIdSpy = jest
      .spyOn(performanceModule, 'findWorkerById' as any)
      .mockResolvedValue({
        workerId,
        workerName: 'Test Worker',
        status: 'active',
      });

    // Mock findInitialAssignmentByWorker
    const findInitialAssignmentByWorkerSpy = jest
      .spyOn(performanceModule, 'findInitialAssignmentByWorker' as any)
      .mockResolvedValue({
        initialAssignmentId,
        workerId,
        assignmentStartDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        status: 'active',
      });

    // Mock findPerformanceRecordsByWorkerAndPeriod with multiple work types (minimum 3 records)
    const findPerformanceRecordsByWorkerAndPeriodSpy = jest
      .spyOn(performanceModule, 'findPerformanceRecordsByWorkerAndPeriod' as any)
      .mockResolvedValue([
        {
          recordId: 'REC001',
          workerId,
          workTypeId: 'WT001',
          workTypeName: 'Assembly',
          completedQuantity: 50,
          workTimeMinutes: 480,
          qualityScore: 95,
        },
        {
          recordId: 'REC002',
          workerId,
          workTypeId: 'WT002',
          workTypeName: 'Inspection',
          completedQuantity: 40,
          workTimeMinutes: 360,
          qualityScore: 90,
        },
        {
          recordId: 'REC003',
          workerId,
          workTypeId: 'WT003',
          workTypeName: 'Packaging',
          completedQuantity: 60,
          workTimeMinutes: 420,
          qualityScore: 92,
        },
      ]);

    // Mock findProductivityDataByWorkerAndPeriod with standard rates
    const findProductivityDataByWorkerAndPeriodSpy = jest
      .spyOn(performanceModule, 'findProductivityDataByWorkerAndPeriod' as any)
      .mockResolvedValue({
        standardProductivityRate: 85.0,
        standardQualityScore: 92.0,
      });

    // Mock findWorkTypeById
    const findWorkTypeByIdSpy = jest
      .spyOn(performanceModule, 'findWorkTypeById' as any)
      .mockImplementation((workTypeId) => {
        const workTypeMap: { [key: string]: string } = {
          WT001: 'Assembly',
          WT002: 'Inspection',
          WT003: 'Packaging',
        };
        return Promise.resolve({
          workTypeId,
          workTypeName: workTypeMap[workTypeId] || 'Unknown',
        });
      });

    // Mock validateInputData
    const validateInputDataSpy = jest
      .spyOn(performanceModule, 'validateInputData' as any)
      .mockResolvedValue(true);

    // Mock sendInitialAssignmentPerformanceAnalysisToLeader
    const sendInitialAssignmentPerformanceAnalysisToLeaderSpy = jest
      .spyOn(performanceModule, 'sendInitialAssignmentPerformanceAnalysisToLeader' as any)
      .mockResolvedValue(undefined);

    // Call the function
    let result;
    let error;
    try {
      result = await analyzeInitialAssignmentPerformance({
        workerId,
        initialAssignmentId,
        analysisStartDateTime: twentyFourHoursAgo,
        analysisEndDateTime: now,
        requestingUserId,
      });
    } catch (e) {
      error = e;
    }

    // 9. エラーが発生しないこと
    expect(error).toBeUndefined();
    expect(result).toBeDefined();

    // 1. aggregatedPerformanceData の検証
    expect(result.aggregatedPerformanceData.totalCompletedQuantity).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.totalWorkTimeMinutes).toBeGreaterThan(0);
    expect(result.aggregatedPerformanceData.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedPerformanceData.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.aggregatedPerformanceData.workTypeBreakdown)).toBe(true);
    expect(result.aggregatedPerformanceData.workTypeBreakdown.length).toBeGreaterThan(0);

    result.aggregatedPerformanceData.workTypeBreakdown.forEach((wt) => {
      expect(wt.workTypeId).toBeDefined();
      expect(wt.workTypeName).toBeDefined();
      expect(typeof wt.completedQuantity).toBe('number');
      expect(wt.completedQuantity).toBeGreaterThanOrEqual(0);
      expect(typeof wt.workTimeMinutes).toBe('number');
      expect(wt.workTimeMinutes).toBeGreaterThanOrEqual(0);
      expect(typeof wt.productivityRate).toBe('number');
      expect(typeof wt.qualityScore).toBe('number');
    });

    // 2. proficiencyStage の検証
    expect(['BEGINNER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT']).toContain(
      result.proficiencyStage.stage
    );
    expect(result.proficiencyStage.stageDescription).toBeDefined();
    expect(typeof result.proficiencyStage.stageDescription).toBe('string');
    expect(result.proficiencyStage.evaluationReason).toBeDefined();
    expect(typeof result.proficiencyStage.evaluationReason).toBe('string');
    expect(typeof result.proficiencyStage.confidenceScore).toBe('number');
    expect(result.proficiencyStage.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.proficiencyStage.confidenceScore).toBeLessThanOrEqual(1);

    // proficiencyStage の判定ロジック検証
    const actualProductivityRate = result.comparisonWithStandardPerformance.actualProductivityRate;
    const standardProductivityRate = result.comparisonWithStandardPerformance.standardProductivityRate;
    const productivityRatio = (actualProductivityRate / standardProductivityRate) * 100;
    
    if (result.proficiencyStage.stage === 'PROFICIENT') {
      expect(productivityRatio).toBeGreaterThanOrEqual(80);
      if (result.riskFlags) {
        const hasHighErrorRate = result.riskFlags.some(rf => rf.riskType === 'HIGH_ERROR_RATE');
        expect(hasHighErrorRate).toBe(false);
      }
    } else if (result.proficiencyStage.stage === 'DEVELOPING') {
      expect(productivityRatio).toBeGreaterThanOrEqual(60);
      expect(productivityRatio).toBeLessThan(80);
    } else if (result.proficiencyStage.stage === 'BEGINNER') {
      expect(productivityRatio).toBeLessThan(60);
    }

    // 3. difficultyAdjustmentRecommendation の検証
    expect([
      'MAINTAIN_CURRENT',
      'INCREASE_DIFFICULTY',
      'DECREASE_DIFFICULTY',
      'CHANGE_WORK_TYPE',
    ]).toContain(result.difficultyAdjustmentRecommendation.recommendedAction);

    expect(Array.isArray(result.difficultyAdjustmentRecommendation.targetWorkTypes)).toBe(true);
    expect(result.difficultyAdjustmentRecommendation.targetWorkTypes.length).toBeGreaterThan(0);

    result.difficultyAdjustmentRecommendation.targetWorkTypes.forEach((wt) => {
      expect(wt.workTypeId).toBeDefined();
      expect(wt.workTypeName).toBeDefined();
      expect(typeof wt.currentDifficultyLevel).toBe('number');
      expect(typeof wt.recommendedDifficultyLevel).toBe('number');
      expect(wt.rationale).toBeDefined();
      expect(typeof wt.rationale).toBe('string');
    });

    expect(result.difficultyAdjustmentRecommendation.implementationTiming).toBeDefined();
    expect(typeof result.difficultyAdjustmentRecommendation.implementationTiming).toBe('string');

    // 4. comparisonWithStandardPerformance の検証
    expect(typeof result.comparisonWithStandardPerformance.standardProductivityRate).toBe('number');
    expect(result.comparisonWithStandardPerformance.standardProductivityRate).toBeGreaterThanOrEqual(0);

    expect(typeof result.comparisonWithStandardPerformance.actualProductivityRate).toBe('number');
    expect(result.comparisonWithStandardPerformance.actualProductivityRate).toBeGreaterThanOrEqual(0);

    expect(typeof result.comparisonWithStandardPerformance.deviationPercentage).toBe('number');

    // deviationPercentage の計算式を検証
    const expectedDeviation =
      ((result.comparisonWithStandardPerformance.actualProductivityRate -
        result.comparisonWithStandardPerformance.standardProductivityRate) /
        result.comparisonWithStandardPerformance.standardProductivityRate) *
      100;
    expect(result.comparisonWithStandardPerformance.deviationPercentage).toBeCloseTo(
      expectedDeviation,
      2
    );

    expect(typeof result.comparisonWithStandardPerformance.standardQualityScore).toBe('number');
    expect(result.comparisonWithStandardPerformance.standardQualityScore).toBeGreaterThanOrEqual(0);

    expect(typeof result.comparisonWithStandardPerformance.actualQualityScore).toBe('number');
    expect(result.comparisonWithStandardPerformance.actualQualityScore).toBeGreaterThanOrEqual(0);

    expect(typeof result.comparisonWithStandardPerformance.qualityDeviation).toBe('number');

    // 5. analysisPeriod の検証
    expect(result.analysisPeriod.startDateTime).toEqual(twentyFourHoursAgo);
    expect(result.analysisPeriod.endDateTime).toEqual(now);

    // 6. nextReviewSchedule の検証
    expect(result.nextReviewSchedule instanceof Date).toBe(true);
    expect(result.nextReviewSchedule.getTime()).toBeGreaterThan(
      result.analysisTimestamp.getTime()
    );

    // 7. analysisTimestamp の検証
    expect(result.analysisTimestamp instanceof Date).toBe(true);
    expect(result.analysisTimestamp.getTime()).toBeCloseTo(Date.now(), -2);

    // ワーカーと初期割当IDの確認
    expect(result.workerId).toBe(workerId);
    expect(result.initialAssignmentId).toBe(initialAssignmentId);

    // 習熟度と難度調整の関連性を検証
    expect(result.proficiencyStage.stage).toBeDefined();
    expect(result.difficultyAdjustmentRecommendation.recommendedAction).toBeDefined();

    // PROFICIENT の場合は難度を上げる傾向
    if (result.proficiencyStage.stage === 'PROFICIENT') {
      expect(['INCREASE_DIFFICULTY', 'CHANGE_WORK_TYPE']).toContain(
        result.difficultyAdjustmentRecommendation.recommendedAction
      );
    }
    // BEGINNER の場合は難度を下げるか維持
    else if (result.proficiencyStage.stage === 'BEGINNER') {
      expect(['DECREASE_DIFFICULTY', 'MAINTAIN_CURRENT']).toContain(
        result.difficultyAdjustmentRecommendation.recommendedAction
      );
    }

    // 8. sendInitialAssignmentPerformanceAnalysisToLeader の呼び出し確認
    expect(sendInitialAssignmentPerformanceAnalysisToLeaderSpy).toHaveBeenCalledTimes(1);
    expect(sendInitialAssignmentPerformanceAnalysisToLeaderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId,
        initialAssignmentId,
        aggregatedPerformanceData: expect.any(Object),
        proficiencyStage: expect.any(Object),
        difficultyAdjustmentRecommendation: expect.any(Object),
        comparisonWithStandardPerformance: expect.any(Object),
      }),
      requestingUserId
    );
  });
});