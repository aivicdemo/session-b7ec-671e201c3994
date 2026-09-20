import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchExecution from '../../src/logic/daily-batch-execution';

describe('SCEN-158: 定時実行予定時刻に達し、データ集約完了率が95%以上で、手動トリガーなしでバッチ実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully execute daily batch process at scheduled time with 95% aggregation completion rate', async () => {
    // 前日のデータ集約処理完了時刻を設定する
    const aggregationCompletionTime = new Date('2024-01-14T23:00:00Z');
    
    // 現在の日時を定時実行予定時刻である午前5時に設定する
    const scheduledExecutionTime = new Date('2024-01-15T05:00:00Z');
    
    // データ集約完了率を95%に設定する
    const aggregationCompletionRate = 95;
    
    // 手動トリガーフラグをfalseに設定する
    const manualTrigger = false;
    
    // 対象日付を前日の日付で設定する
    const targetDate = '2024-01-14';

    // validateInputData をスタブ化し、入力値が有効であることを示す結果を返すように設定する
    jest.spyOn(dailyBatchExecution, 'validateInputData' as any).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // 業務ルール br-tx_2-001 の validateDailyBatchTriggerCondition をスタブ化
    jest.spyOn(dailyBatchExecution, 'validateDailyBatchTriggerCondition' as any).mockResolvedValue({
      canExecuteBatch: true,
      executionReason: 'scheduled_time',
      aggregatedDataCompletionRate: 95,
      targetSiteCount: 3,
      aggregatedRecordCount: 1500,
    });

    // aggregatePerformanceDataForBatch をスタブ化
    jest.spyOn(dailyBatchExecution, 'aggregatePerformanceDataForBatch' as any).mockResolvedValue({
      aggregatedRecordCount: 1500,
      siteCount: 3,
      departmentCount: 5,
      workerCount: 45,
      aggregationCompletionRate: 95,
      dataQualityIssues: [],
    });

    // analyzeProductivityTrends をスタブ化
    jest.spyOn(dailyBatchExecution, 'analyzeProductivityTrends' as any).mockResolvedValue({
      analysisId: 'analysis-001',
      analysisTimestamp: new Date().toISOString(),
      productivityTrends: [],
      proficiencyProgressions: [],
      qualityVarianceAlerts: [],
      productivityPatterns: [],
      anomalousValues: [],
      analysisDataQualityScore: 0.95,
      analysisCompleteness: 0.98,
    });

    // generateOptimalPlacementRecommendations をスタブ化
    jest.spyOn(dailyBatchExecution, 'generateOptimalPlacementRecommendations' as any).mockResolvedValue([
      {
        recommendationId: 'rec-001',
        workerId: 'worker-001',
        currentDepartment: 'dept-A',
        recommendedDepartment: 'dept-B',
        recommendedWorkType: 'assembly',
        expectedProductivityImprovement: 12.5,
        optimizationRationale: 'High proficiency in assembly tasks',
        confidenceScore: 85,
      },
    ]);

    // validateBatchDataQuality をスタブ化
    jest.spyOn(dailyBatchExecution, 'validateBatchDataQuality' as any).mockResolvedValue({
      validationStatus: 'valid',
      completenessScore: 0.98,
      anomalousValueCount: 0,
      dataQualityIssues: [],
      validationTimestamp: new Date().toISOString(),
    });

    // verifyAnalysisResultValidity をスタブ化
    jest.spyOn(dailyBatchExecution, 'verifyAnalysisResultValidity' as any).mockResolvedValue({
      verificationStatus: 'valid',
      validityScore: 92,
      validityJudgmentReason: 'Analysis results are consistent with historical patterns',
      approvalRecommendation: 'approve',
      detectedExceptions: [],
    });

    // saveProductivityData をスタブ化
    jest.spyOn(dailyBatchExecution, 'saveProductivityData' as any).mockResolvedValue({
      success: true,
      savedRecordCount: 1500,
    });

    // saveComparisonAnalysisResult をスタブ化
    jest.spyOn(dailyBatchExecution, 'saveComparisonAnalysisResult' as any).mockResolvedValue({
      success: true,
      savedResultId: 'comparison-result-001',
    });

    // sendAnalysisResultVerificationToManager をスタブ化
    jest.spyOn(dailyBatchExecution, 'sendAnalysisResultVerificationToManager' as any).mockResolvedValue({
      success: true,
      notificationsSent: 3,
      timestamp: new Date().toISOString(),
    });

    // 入力パラメータを設定
    const input = {
      triggerType: 'scheduled' as const,
      targetDate: targetDate,
      executedByUserId: 'system-user-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    // executeDailyBatchProcess を呼び出し
    const result = await executeDailyBatchProcess(input);

    // 戻り値を検証する
    expect(result).toBeDefined();
    
    // executionStatus = 'success' であること
    expect(result.executionStatus).toBe('success');
    
    // batchExecutionId が一意の文字列で生成されていること
    expect(result.batchExecutionId).toBeDefined();
    expect(typeof result.batchExecutionId).toBe('string');
    expect(result.batchExecutionId.length).toBeGreaterThan(0);
    
    // targetDate = '2024-01-14' であること
    expect(result.targetDate).toBe(targetDate);
    
    // aggregationResult が集約処理の成功を示していること
    expect(result.aggregationResult).toBeDefined();
    expect(result.aggregationResult.aggregatedRecordCount).toBe(1500);
    
    // analysisResult が分析処理の成功を示していること
    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.analysisId).toBeDefined();
    
    // placementRecommendations が空配列以外の配列で返されること
    expect(result.placementRecommendations).toBeDefined();
    expect(Array.isArray(result.placementRecommendations)).toBe(true);
    expect(result.placementRecommendations.length).toBeGreaterThan(0);
    
    // dataQualityValidation が実行済みで検証結果が含まれていること
    expect(result.dataQualityValidation).toBeDefined();
    expect(result.dataQualityValidation).not.toBeNull();
    expect(result.dataQualityValidation.validationStatus).toBe('valid');
    
    // analysisResultVerification が実行済みで検証結果が含まれていること
    expect(result.analysisResultVerification).toBeDefined();
    expect(result.analysisResultVerification).not.toBeNull();
    expect(result.analysisResultVerification.verificationStatus).toBe('valid');
    
    // executionStartTime と executionEndTime が ISO 8601 形式で記録されていること
    expect(result.executionStartTime).toBeDefined();
    expect(typeof result.executionStartTime).toBe('string');
    expect(new Date(result.executionStartTime).toISOString()).toBe(result.executionStartTime);
    
    expect(result.executionEndTime).toBeDefined();
    expect(typeof result.executionEndTime).toBe('string');
    expect(new Date(result.executionEndTime).toISOString()).toBe(result.executionEndTime);
    
    // executionDurationSeconds が 0 より大きい数値であること
    expect(result.executionDurationSeconds).toBeGreaterThan(0);
    expect(typeof result.executionDurationSeconds).toBe('number');
    
    // notificationTargets に管理者ユーザーIDが含まれていること
    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBeGreaterThan(0);
    
    // warnings が空配列であること（95%完了率は閾値以上のため警告なし）
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBe(0);
  });
});