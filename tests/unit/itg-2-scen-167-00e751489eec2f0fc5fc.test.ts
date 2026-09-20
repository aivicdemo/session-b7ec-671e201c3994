import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

describe('SCEN-167: includeAnalysisVerification=trueで分析結果妥当性検証が実行され、妥当性スコアが閾値以下で検証失敗エラーで処理が中止される', () => {
  it('verifyAnalysisResultValidity が妥当性スコア閾値以下の結果を返す場合、AnalysisResultVerificationFailure エラーがスローされる', async () => {
    const aggregationResult = {
      aggregationId: 'agg-001',
      targetDate: '2025-01-15',
      workerProductivitySummaries: [{
        workerId: 'worker-001',
        workerName: 'Test Worker',
        averageProductivityRate: 85,
        averageQualityScore: 90,
        totalWorkHours: 480,
        totalCompletedItems: 100,
      }],
      departmentProductivitySummaries: [{
        departmentId: 'dept-001',
        departmentName: 'Test Department',
        averageProductivityRate: 85,
        averageQualityScore: 90,
        workerCount: 1,
      }],
      workTypeProductivitySummaries: [{
        workTypeId: 'worktype-001',
        workTypeName: 'Test Work Type',
        averageProductivityRate: 85,
        averageQualityScore: 90,
        completionCount: 100,
      }],
      siteProductivitySummaries: [{
        siteId: 'site-001',
        siteName: 'Test Site',
        averageProductivityRate: 85,
        averageQualityScore: 90,
        workerCount: 1,
        totalWorkHours: 480,
      }],
    };

    const analysisResult = {
      analysisId: 'analysis-001',
      analysisTimestamp: new Date().toISOString(),
      productivityTrends: [],
      proficiencyProgressions: [],
      qualityVarianceAlerts: [],
      productivityPatterns: [],
      anomalousValues: [],
      analysisDataQualityScore: 0.95,
      analysisCompleteness: 0.9,
    };

    const mockVerifyAnalysisResultValidity = jest.fn().mockResolvedValue({
      verificationStatus: 'invalid',
      validityScore: 45,
      validityJudgmentReason: 'テスト用：妥当性スコアが低い',
      approvalRecommendation: 'reject',
      detectedExceptions: [],
    });

    const mockAggregatePerformanceDataForBatch = jest.fn().mockResolvedValue(aggregationResult);
    const mockAnalyzeProductivityTrends = jest.fn().mockResolvedValue(analysisResult);
    const mockGenerateOptimalPlacementRecommendations = jest.fn().mockResolvedValue({
      recommendations: [],
    });
    const mockValidateBatchDataQuality = jest.fn().mockResolvedValue({
      validationId: 'val-001',
      validationStatus: 'passed',
      completenessScore: 0.95,
      anomalyRate: 0.02,
      detectedIssues: [],
    });
    const mockSendAnalysisResultVerificationToManager = jest.fn();

    jest.spyOn(dailyBatchModule, 'verifyAnalysisResultValidity' as any).mockImplementation(mockVerifyAnalysisResultValidity);
    jest.spyOn(dailyBatchModule, 'aggregatePerformanceDataForBatch' as any).mockImplementation(mockAggregatePerformanceDataForBatch);
    jest.spyOn(dailyBatchModule, 'analyzeProductivityTrends' as any).mockImplementation(mockAnalyzeProductivityTrends);
    jest.spyOn(dailyBatchModule, 'generateOptimalPlacementRecommendations' as any).mockImplementation(mockGenerateOptimalPlacementRecommendations);
    jest.spyOn(dailyBatchModule, 'validateBatchDataQuality' as any).mockImplementation(mockValidateBatchDataQuality);
    jest.spyOn(dailyBatchModule, 'sendAnalysisResultVerificationToManager' as any).mockImplementation(mockSendAnalysisResultVerificationToManager);

    const targetDate = '2025-01-15';
    const executedByUserId = 'system-user-001';

    const promise = executeDailyBatchProcess({
      triggerType: 'scheduled',
      targetDate: targetDate,
      executedByUserId: executedByUserId,
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    });

    await expect(promise).rejects.toThrow('分析結果の妥当性検証に失敗しました。異常値や例外が検出されています。');

    expect(mockAggregatePerformanceDataForBatch).toHaveBeenCalled();
    expect(mockAnalyzeProductivityTrends).toHaveBeenCalled();
    expect(mockGenerateOptimalPlacementRecommendations).toHaveBeenCalled();
    expect(mockValidateBatchDataQuality).toHaveBeenCalled();
    expect(mockVerifyAnalysisResultValidity).toHaveBeenCalled();

    expect(mockSendAnalysisResultVerificationToManager).not.toHaveBeenCalled();

    try {
      await executeDailyBatchProcess({
        triggerType: 'scheduled',
        targetDate: targetDate,
        executedByUserId: executedByUserId,
        includeQualityValidation: true,
        includeAnalysisVerification: true,
      });
    } catch (error: any) {
      expect(error.name || error.constructor.name).toBe('AnalysisResultVerificationFailure');
      expect(error.message).toBe('分析結果の妥当性検証に失敗しました。異常値や例外が検出されています。');
    }
  });
});