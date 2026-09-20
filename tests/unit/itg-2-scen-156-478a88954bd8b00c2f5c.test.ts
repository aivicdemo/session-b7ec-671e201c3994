import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';

describe('SCEN-156: 定時トリガーで手動介入なく日次バッチ処理が完了し、全ステップの結果と通知対象を返す', () => {
  it('should execute daily batch process with scheduled trigger and return complete results', async () => {
    // Arrange
    const input = {
      triggerType: 'scheduled' as const,
      targetDate: '2024-01-16',
      executedByUserId: 'system-user-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    // Mock dependencies
    const mockBatchAggregationResult = {
      aggregatedRecordCount: 1000,
      targetSiteCount: 10,
      aggregationCompletenessRate: 0.98,
      workerProductivitySummaries: [],
      departmentProductivitySummaries: [],
      workTypeProductivitySummaries: [],
      siteProductivitySummaries: [],
    };

    const mockAnalysisResult = {
      analysisId: 'analysis-001',
      analysisTimestamp: new Date().toISOString(),
      productivityTrends: [],
      proficiencyProgressions: [],
      qualityVarianceAlerts: [],
      productivityPatterns: [],
      anomalousValues: [],
      analysisDataQualityScore: 0.95,
      analysisCompleteness: 0.98,
    };

    const mockPlacementRecommendations = [
      {
        recommendationId: 'rec-001',
        workerId: 'worker-001',
        currentDepartment: 'dept-001',
        recommendedDepartment: 'dept-002',
        recommendedWorkType: 'type-001',
        expectedProductivityImprovement: 15.5,
        optimizationRationale: 'Based on productivity analysis',
        confidenceScore: 0.88,
      },
      {
        recommendationId: 'rec-002',
        workerId: 'worker-002',
        currentDepartment: 'dept-002',
        recommendedDepartment: 'dept-003',
        recommendedWorkType: 'type-002',
        expectedProductivityImprovement: 12.3,
        optimizationRationale: 'Skill improvement path',
        confidenceScore: 0.85,
      },
      {
        recommendationId: 'rec-003',
        workerId: 'worker-003',
        currentDepartment: 'dept-001',
        recommendedDepartment: 'dept-003',
        recommendedWorkType: 'type-001',
        expectedProductivityImprovement: 18.7,
        optimizationRationale: 'Peak performance alignment',
        confidenceScore: 0.92,
      },
    ];

    const mockDataQualityValidation = {
      validationStatus: 'passed' as const,
      completenessScore: 0.96,
      anomalousValueCount: 2,
      dataInconsistencies: [],
      validationTimestamp: new Date().toISOString(),
      validationDetails: 'Data quality check completed successfully',
    };

    const mockAnalysisResultVerification = {
      verificationStatus: 'valid' as const,
      validityScore: 0.92,
      validityJudgmentReason: 'Analysis results are within acceptable variance',
      approvalRecommendation: 'approve' as const,
      detectedExceptions: [],
    };

    // Mock the dependent functions
    const validateInputDataMock = jest.fn().mockResolvedValue(true);
    const aggregatePerformanceDataForBatchMock = jest.fn().mockResolvedValue(mockBatchAggregationResult);
    const analyzeProductivityTrendsMock = jest.fn().mockResolvedValue(mockAnalysisResult);
    const generateOptimalPlacementRecommendationsMock = jest.fn().mockResolvedValue(mockPlacementRecommendations);
    const validateBatchDataQualityMock = jest.fn().mockResolvedValue(mockDataQualityValidation);
    const verifyAnalysisResultValidityMock = jest.fn().mockResolvedValue(mockAnalysisResultVerification);
    const saveProductivityDataMock = jest.fn().mockResolvedValue(true);
    const saveComparisonAnalysisResultMock = jest.fn().mockResolvedValue(true);
    const sendAnalysisResultVerificationToManagerMock = jest.fn().mockResolvedValue(true);

    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'validateInputData')
      .mockImplementation(validateInputDataMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'aggregatePerformanceDataForBatch')
      .mockImplementation(aggregatePerformanceDataForBatchMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'analyzeProductivityTrends')
      .mockImplementation(analyzeProductivityTrendsMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'generateOptimalPlacementRecommendations')
      .mockImplementation(generateOptimalPlacementRecommendationsMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'validateBatchDataQuality')
      .mockImplementation(validateBatchDataQualityMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'verifyAnalysisResultValidity')
      .mockImplementation(verifyAnalysisResultValidityMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'saveProductivityData')
      .mockImplementation(saveProductivityDataMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'saveComparisonAnalysisResult')
      .mockImplementation(saveComparisonAnalysisResultMock);
    jest.spyOn(require('../../src/logic/daily-batch-execution'), 'sendAnalysisResultVerificationToManager')
      .mockImplementation(sendAnalysisResultVerificationToManagerMock);

    // Act
    const result = await executeDailyBatchProcess(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.batchExecutionId).toBeDefined();
    expect(typeof result.batchExecutionId).toBe('string');
    expect(result.batchExecutionId.length).toBeGreaterThan(0);

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-16');

    expect(result.aggregationResult).toBeDefined();
    expect(result.aggregationResult.aggregatedRecordCount).toBe(1000);
    expect(result.aggregationResult.targetSiteCount).toBe(10);
    expect(result.aggregationResult.aggregationCompletenessRate).toBe(0.98);

    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.analysisId).toBeDefined();
    expect(result.analysisResult.analysisTimestamp).toBeDefined();
    expect(Array.isArray(result.analysisResult.productivityTrends)).toBe(true);
    expect(result.analysisResult.analysisDataQualityScore).toBe(0.95);
    expect(result.analysisResult.analysisCompleteness).toBe(0.98);

    expect(result.placementRecommendations).toBeDefined();
    expect(Array.isArray(result.placementRecommendations)).toBe(true);
    expect(result.placementRecommendations.length).toBe(3);
    
    result.placementRecommendations.forEach((rec) => {
      expect(rec.recommendationId).toBeDefined();
      expect(rec.workerId).toBeDefined();
      expect(rec.currentDepartment).toBeDefined();
      expect(rec.recommendedDepartment).toBeDefined();
      expect(rec.recommendedWorkType).toBeDefined();
      expect(typeof rec.expectedProductivityImprovement).toBe('number');
      expect(rec.expectedProductivityImprovement).toBeGreaterThan(0);
      expect(rec.optimizationRationale).toBeDefined();
      expect(typeof rec.confidenceScore).toBe('number');
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rec.confidenceScore).toBeLessThanOrEqual(1);
    });

    expect(result.dataQualityValidation).toBeDefined();
    expect(result.dataQualityValidation?.validationStatus).toBe('passed');
    expect(result.dataQualityValidation?.completenessScore).toBe(0.96);

    expect(result.analysisResultVerification).toBeDefined();
    expect(result.analysisResultVerification?.verificationStatus).toBe('valid');
    expect(result.analysisResultVerification?.validityScore).toBe(0.92);
    expect(result.analysisResultVerification?.validityScore).toBeGreaterThanOrEqual(0.80);
    expect(result.analysisResultVerification?.approvalRecommendation).toBe('approve');

    expect(result.executionStartTime).toBeDefined();
    expect(typeof result.executionStartTime).toBe('string');
    expect(() => new Date(result.executionStartTime)).not.toThrow();

    expect(result.executionEndTime).toBeDefined();
    expect(typeof result.executionEndTime).toBe('string');
    expect(() => new Date(result.executionEndTime)).not.toThrow();

    expect(result.executionDurationSeconds).toBeDefined();
    expect(typeof result.executionDurationSeconds).toBe('number');
    expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(0);

    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBeGreaterThan(0);
    result.notificationTargets.forEach((target) => {
      expect(typeof target).toBe('string');
      expect(target.length).toBeGreaterThan(0);
    });

    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);

    // Verify all dependent functions are called exactly once
    expect(validateInputDataMock).toHaveBeenCalledTimes(1);
    expect(aggregatePerformanceDataForBatchMock).toHaveBeenCalledTimes(1);
    expect(analyzeProductivityTrendsMock).toHaveBeenCalledTimes(1);
    expect(generateOptimalPlacementRecommendationsMock).toHaveBeenCalledTimes(1);
    expect(validateBatchDataQualityMock).toHaveBeenCalledTimes(1);
    expect(verifyAnalysisResultValidityMock).toHaveBeenCalledTimes(1);
    expect(saveProductivityDataMock).toHaveBeenCalledTimes(1);
    expect(saveComparisonAnalysisResultMock).toHaveBeenCalledTimes(1);
    expect(sendAnalysisResultVerificationToManagerMock).toHaveBeenCalledTimes(1);

    // Verify aggregatePerformanceDataForBatch is called with targetDate '2024-01-15' (previous day)
    expect(aggregatePerformanceDataForBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDate: '2024-01-15',
      })
    );
  });
});