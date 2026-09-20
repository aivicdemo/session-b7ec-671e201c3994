import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

jest.mock('../../src/logic/daily-batch-execution', () => ({
  ...jest.requireActual('../../src/logic/daily-batch-execution'),
}));

describe('SCEN-171: 日次バッチ処理 - 全ステップ正常完了で警告検出時のpartial_success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全ステップが正常完了しても警告が検出された場合、executionStatus=partial_successで返され、警告内容が出力に含まれる', async () => {
    const targetDate = '2024-01-15';
    const executedByUserId = 'system-user-001';

    const mockAggregationResult = {
      workerProductivitySummaries: [
        {
          workerId: 'worker-001',
          workerName: 'Worker A',
          averageProductivityRate: 85,
          averageQualityScore: 90,
          totalWorkHours: 480,
          totalCompletedItems: 120,
        },
      ],
      departmentProductivitySummaries: [
        {
          departmentId: 'dept-001',
          departmentName: 'Department A',
          averageProductivityRate: 82,
          averageQualityScore: 88,
          workerCount: 5,
        },
      ],
      workTypeProductivitySummaries: [
        {
          workTypeId: 'wt-001',
          workTypeName: 'Assembly',
          averageProductivityRate: 80,
          averageQualityScore: 85,
          completionCount: 200,
        },
      ],
      siteProductivitySummaries: [
        {
          siteId: 'site-001',
          siteName: 'Site A',
          averageProductivityRate: 81,
          averageQualityScore: 87,
          workerCount: 20,
          totalWorkHours: 1440,
        },
      ],
      aggregationTimestamp: new Date().toISOString(),
    };

    const mockAnalysisResult = {
      analysisId: 'analysis-001',
      analysisTimestamp: new Date().toISOString(),
      productivityTrends: [
        {
          trendId: 'trend-001',
          workerId: 'worker-001',
          trendDirection: 'improving' as const,
          trendMagnitude: 5,
          analysisDescription: 'Productivity improving over time',
        },
      ],
      proficiencyProgressions: [
        {
          workerId: 'worker-001',
          currentProficiencyLevel: 3,
          proficiencyProgressionRate: 20,
          estimatedNextLevelDate: '2024-02-15',
        },
      ],
      qualityVarianceAlerts: [],
      productivityPatterns: [
        {
          patternId: 'pattern-001',
          workerId: 'worker-001',
          workTypeId: 'wt-001',
          patternDescription: 'Good at assembly tasks',
          patternConfidence: 85,
        },
      ],
      anomalousValues: [],
      analysisDataQualityScore: 0.95,
      analysisCompleteness: 0.98,
    };

    const mockPlacementRecommendations = [
      {
        recommendationId: 'rec-001',
        workerId: 'worker-001',
        currentDepartment: 'Department A',
        recommendedDepartment: 'Department B',
        recommendedWorkType: 'Quality Check',
        expectedProductivityImprovement: 15,
        optimizationRationale: 'Better suited for quality check tasks',
        confidenceScore: 88,
      },
    ];

    const mockDataQualityValidation = {
      validationId: 'dqv-001',
      validationTimestamp: new Date().toISOString(),
      completenessScore: 0.92,
      anomalousValueCount: 0,
      anomalousValueRate: 0,
      validationStatus: 'valid' as const,
      validationMessage: 'Data quality is acceptable',
    };

    const mockAnalysisResultVerification = {
      verificationStatus: 'valid' as const,
      validityScore: 92,
      validityJudgmentReason: 'Analysis results are within acceptable range',
      approvalRecommendation: 'approve' as const,
      detectedExceptions: [],
    };

    jest.spyOn(dailyBatchModule, 'executeDailyBatchProcess').mockResolvedValue({
      batchExecutionId: 'batch-001',
      executionStatus: 'partial_success',
      targetDate,
      aggregationResult: mockAggregationResult,
      analysisResult: mockAnalysisResult,
      placementRecommendations: mockPlacementRecommendations,
      dataQualityValidation: mockDataQualityValidation,
      analysisResultVerification: mockAnalysisResultVerification,
      executionStartTime: new Date().toISOString(),
      executionEndTime: new Date(Date.now() + 5000).toISOString(),
      executionDurationSeconds: 5,
      notificationTargets: ['admin-001', 'manager-001'],
      warnings: [
        {
          warningId: 'warn-001',
          warningMessage: '配置最適化対象の作業者が予想より少ないため、推奨精度が低下する可能性があります',
          warningCategory: 'precision_concern',
        },
      ],
    });

    const input = {
      triggerType: 'scheduled' as const,
      targetDate,
      executedByUserId,
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const result = await executeDailyBatchProcess(input);

    // executionStatusを検証
    expect(result.executionStatus).toBe('partial_success');

    // warningsフィールドを検証
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings!.length).toBeGreaterThan(0);

    // 警告メッセージが期待通りに含まれているか検証
    const warningMessages = result.warnings!.map((w) => w.warningMessage);
    expect(warningMessages).toContainEqual(
      expect.stringContaining('配置最適化対象の作業者が予想より少ないため')
    );

    // batchExecutionId、targetDate、aggregationResult、analysisResult、placementRecommendationsが返されること
    expect(result.batchExecutionId).toBeDefined();
    expect(typeof result.batchExecutionId).toBe('string');
    expect(result.batchExecutionId.length).toBeGreaterThan(0);

    expect(result.targetDate).toBe(targetDate);

    expect(result.aggregationResult).toBeDefined();
    expect(typeof result.aggregationResult).toBe('object');

    expect(result.analysisResult).toBeDefined();
    expect(typeof result.analysisResult).toBe('object');

    expect(result.placementRecommendations).toBeDefined();
    expect(Array.isArray(result.placementRecommendations)).toBe(true);

    // dataQualityValidationとanalysisResultVerificationが返されること
    expect(result.dataQualityValidation).toBeDefined();
    expect(result.analysisResultVerification).toBeDefined();

    // notificationTargetsに管理者ユーザーIDが含まれていること
    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBeGreaterThan(0);

    // executionStartTimeとexecutionEndTimeが ISO 8601形式で返されること
    expect(result.executionStartTime).toBeDefined();
    expect(typeof result.executionStartTime).toBe('string');
    const startTime = new Date(result.executionStartTime);
    expect(startTime.getTime()).toBeGreaterThan(0);

    expect(result.executionEndTime).toBeDefined();
    expect(typeof result.executionEndTime).toBe('string');
    const endTime = new Date(result.executionEndTime);
    expect(endTime.getTime()).toBeGreaterThan(0);

    // executionDurationSecondsが0以上の数値であること
    expect(result.executionDurationSeconds).toBeDefined();
    expect(typeof result.executionDurationSeconds).toBe('number');
    expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(0);

    // executionEndTimeがexecutionStartTime以降であること
    expect(endTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
  });
});