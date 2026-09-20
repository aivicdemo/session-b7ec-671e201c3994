import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import {
  ExecuteDailyBatchProcessInput,
  ExecuteDailyBatchProcessOutput,
  BatchAggregationResult,
  AnalyzeProductivityTrendsOutput,
} from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

jest.mock('../../src/logic/daily-batch-execution', () => {
  const actual = jest.requireActual('../../src/logic/daily-batch-execution');
  return {
    ...actual,
    aggregatePerformanceDataForBatch: jest.fn(),
    analyzeProductivityTrends: jest.fn(),
    generateOptimalPlacementRecommendations: jest.fn(),
    validateBatchDataQuality: jest.fn(),
    verifyAnalysisResultValidity: jest.fn(),
  };
});

describe('SCEN-162: 前日の作業実績データが0件で記録されていないため、警告メッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock aggregatePerformanceDataForBatch to return 0 records
    (dailyBatchModule.aggregatePerformanceDataForBatch as jest.Mock).mockResolvedValue({
      aggregatedRecordCount: 0,
      targetSiteCount: 1,
      aggregatedDataCompletionRate: 95,
      workerProductivitySummaries: [],
      departmentProductivitySummaries: [],
      workTypeProductivitySummaries: [],
      siteProductivitySummaries: [],
    } as BatchAggregationResult);

    // Mock analyzeProductivityTrends to return analysis with no trends
    (dailyBatchModule.analyzeProductivityTrends as jest.Mock).mockResolvedValue({
      analysisId: 'analysis-001',
      analysisTimestamp: new Date().toISOString(),
      productivityTrends: [],
      proficiencyProgressions: [],
      qualityVarianceAlerts: [],
      productivityPatterns: [],
      anomalousValues: [],
      analysisDataQualityScore: 0.5,
      analysisCompleteness: 0.0,
    } as AnalyzeProductivityTrendsOutput);

    // Mock generateOptimalPlacementRecommendations to return empty array
    (dailyBatchModule.generateOptimalPlacementRecommendations as jest.Mock).mockResolvedValue([]);

    // Mock validateBatchDataQuality
    (dailyBatchModule.validateBatchDataQuality as jest.Mock).mockResolvedValue({
      validationStatus: 'valid',
      anomalousValueCount: 0,
      validationMessage: 'No data to validate',
    });

    // Mock verifyAnalysisResultValidity
    (dailyBatchModule.verifyAnalysisResultValidity as jest.Mock).mockResolvedValue({
      verificationStatus: 'questionable',
      validityScore: 0,
      validityJudgmentReason: 'Insufficient data for analysis',
      approvalRecommendation: 'review_required',
      detectedExceptions: [],
    });
  });

  it('should return partial_success with warning when aggregated record count is 0', async () => {
    // Setup: Create input for scheduled batch execution
    const input: ExecuteDailyBatchProcessInput = {
      triggerType: 'scheduled',
      targetDate: '2024-01-09',
      executedByUserId: 'system-user-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    // Execute
    const result: ExecuteDailyBatchProcessOutput = await executeDailyBatchProcess(input);

    // Verify execution status is partial_success
    expect(result.executionStatus).toBe('partial_success');

    // Verify aggregation result has 0 records
    expect(result.aggregationResult.aggregatedRecordCount).toBe(0);

    // Verify warnings contain the expected message
    expect(result.warnings).toBeDefined();
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0].warningMessage).toBe(
      '前日の作業実績データが記録されていません。データ収集状況を確認してください'
    );

    // Verify placement recommendations are empty
    expect(result.placementRecommendations).toEqual([]);

    // Verify analysis result is null or lacks meaningful data
    if (result.analysisResult === null) {
      expect(result.analysisResult).toBeNull();
    } else {
      expect(result.analysisResult).toBeDefined();
      expect(result.analysisResult.productivityTrends).toEqual([]);
      expect(result.analysisResult.proficiencyProgressions).toEqual([]);
      expect(result.analysisResult.qualityVarianceAlerts).toEqual([]);
      expect(result.analysisResult.productivityPatterns).toEqual([]);
      expect(result.analysisResult.anomalousValues).toEqual([]);
    }

    // Verify notification targets include admin user for warning notification
    expect(result.notificationTargets).toBeDefined();
    expect(result.notificationTargets.length).toBeGreaterThan(0);

    // Verify timing fields are present
    expect(result.executionStartTime).toBeDefined();
    expect(result.executionEndTime).toBeDefined();
    expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(0);

    // Verify batch execution ID is generated
    expect(result.batchExecutionId).toBeDefined();

    // Verify targetDate matches input
    expect(result.targetDate).toBe('2024-01-09');
  });
});