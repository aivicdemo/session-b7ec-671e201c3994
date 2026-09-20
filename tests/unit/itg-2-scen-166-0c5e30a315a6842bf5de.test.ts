import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

describe('SCEN-166: 日次バッチ処理の品質検証失敗エラー処理', () => {
  let mockAggregatePerformanceDataForBatch: jest.Mock;
  let mockAnalyzeProductivityTrends: jest.Mock;
  let mockGenerateOptimalPlacementRecommendations: jest.Mock;
  let mockVerifyAnalysisResultValidity: jest.Mock;
  let mockValidateBatchDataQuality: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockSendAnalysisResultVerificationToManager: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock internal functions
    mockAggregatePerformanceDataForBatch = jest.fn().mockResolvedValue({
      batchAggregationId: 'agg-001',
      aggregationDate: '2024-01-15',
      workerProductivitySummaries: [
        {
          workerId: 'worker-001',
          workerName: 'Test Worker',
          averageProductivityRate: 85,
          averageQualityScore: 90,
          totalWorkHours: 480,
          totalCompletedItems: 100,
        },
      ],
      departmentProductivitySummaries: [
        {
          departmentId: 'dept-001',
          departmentName: 'Test Department',
          averageProductivityRate: 85,
          averageQualityScore: 90,
          workerCount: 10,
        },
      ],
      workTypeProductivitySummaries: [
        {
          workTypeId: 'worktype-001',
          workTypeName: 'Assembly',
          averageProductivityRate: 85,
          averageQualityScore: 90,
          completionCount: 100,
        },
      ],
      siteProductivitySummaries: [
        {
          siteId: 'site-001',
          siteName: 'Test Site',
          averageProductivityRate: 85,
          averageQualityScore: 90,
          workerCount: 10,
          totalWorkHours: 4800,
        },
      ],
    });

    mockAnalyzeProductivityTrends = jest.fn().mockResolvedValue({
      analysisId: 'analysis-001',
      analysisTimestamp: new Date().toISOString(),
      productivityTrends: [
        {
          trendId: 'trend-001',
          workerId: 'worker-001',
          trendDirection: 'improving' as const,
          trendMagnitude: 5,
          analysisDescription: 'Positive trend',
        },
      ],
      proficiencyProgressions: [
        {
          workerId: 'worker-001',
          currentProficiencyLevel: 3,
          proficiencyProgressionRate: 75,
          estimatedNextLevelDate: '2024-02-15',
        },
      ],
      qualityVarianceAlerts: [],
      productivityPatterns: [],
      anomalousValues: [],
      analysisDataQualityScore: 0.95,
      analysisCompleteness: 0.98,
    });

    mockGenerateOptimalPlacementRecommendations = jest.fn().mockResolvedValue([
      {
        recommendationId: 'rec-001',
        workerId: 'worker-001',
        currentDepartment: 'dept-001',
        recommendedDepartment: 'dept-002',
        recommendedWorkType: 'Assembly',
        expectedProductivityImprovement: 10,
        optimizationRationale: 'Better fit for skills',
        confidenceScore: 85,
      },
    ]);

    mockVerifyAnalysisResultValidity = jest.fn().mockResolvedValue({
      verificationStatus: 'valid' as const,
      validityScore: 95,
      validityJudgmentReason: 'Results are valid',
      approvalRecommendation: 'approve' as const,
      detectedExceptions: [],
    });

    // Mock validateBatchDataQuality to return a failure state
    mockValidateBatchDataQuality = jest.fn().mockResolvedValue({
      validationStatus: 'invalid' as const,
      completenessScore: 0.5,
      anomalousValueDetectionRate: 0.15,
      detectedIssues: [
        {
          issueType: 'incomplete_data',
          severity: 'critical',
          description: '集約データの完全性が基準を満たしていません',
          affectedRecordCount: 50,
        },
      ],
    });

    mockSaveProductivityData = jest.fn().mockResolvedValue(undefined);
    mockSendAnalysisResultVerificationToManager = jest.fn().mockResolvedValue(undefined);

    // Replace module functions with mocks
    jest.spyOn(dailyBatchModule, 'aggregatePerformanceDataForBatch' as any).mockImplementation(mockAggregatePerformanceDataForBatch);
    jest.spyOn(dailyBatchModule, 'analyzeProductivityTrends' as any).mockImplementation(mockAnalyzeProductivityTrends);
    jest.spyOn(dailyBatchModule, 'generateOptimalPlacementRecommendations' as any).mockImplementation(mockGenerateOptimalPlacementRecommendations);
    jest.spyOn(dailyBatchModule, 'verifyAnalysisResultValidity' as any).mockImplementation(mockVerifyAnalysisResultValidity);
    jest.spyOn(dailyBatchModule, 'validateBatchDataQuality' as any).mockImplementation(mockValidateBatchDataQuality);
    jest.spyOn(dailyBatchModule, 'saveProductivityData' as any).mockImplementation(mockSaveProductivityData);
    jest.spyOn(dailyBatchModule, 'sendAnalysisResultVerificationToManager' as any).mockImplementation(mockSendAnalysisResultVerificationToManager);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DataQualityValidationFailure error when quality validation fails', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    await expect(executeDailyBatchProcess(input)).rejects.toThrow(
      '集約データの品質検証に失敗しました。データ入力の正確性を確認してください。'
    );
  });

  it('should record data quality validation details in error', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
      fail('Expected error to be thrown');
    } catch (error: any) {
      expect(error.message).toBe('集約データの品質検証に失敗しました。データ入力の正確性を確認してください。');
      expect(error.code).toBe('DataQualityValidationFailure');
      expect(error.dataQualityValidation).toBeDefined();
      expect(error.dataQualityValidation.validationStatus).toBe('invalid');
    }
  });

  it('should verify that aggregatePerformanceDataForBatch is called', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockAggregatePerformanceDataForBatch).toHaveBeenCalled();
  });

  it('should verify that analyzeProductivityTrends is called', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockAnalyzeProductivityTrends).toHaveBeenCalled();
  });

  it('should verify that generateOptimalPlacementRecommendations is called', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockGenerateOptimalPlacementRecommendations).toHaveBeenCalled();
  });

  it('should verify that validateBatchDataQuality is called and detects critical quality issues', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockValidateBatchDataQuality).toHaveBeenCalled();
  });

  it('should not call saveProductivityData when quality validation fails', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockSaveProductivityData).not.toHaveBeenCalled();
  });

  it('should not call sendAnalysisResultVerificationToManager when quality validation fails', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      // Expected to throw
    }

    expect(mockSendAnalysisResultVerificationToManager).not.toHaveBeenCalled();
  });

  it('should not return output object when quality validation fails', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user-admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    let thrownError: any;
    try {
      await executeDailyBatchProcess(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.code).toBe('DataQualityValidationFailure');
  });
});