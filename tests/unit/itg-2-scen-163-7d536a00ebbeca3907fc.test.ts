import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

describe('SCEN-163: データベース接続エラーによる集約処理失敗', () => {
  let aggregatePerformanceDataForBatchSpy: jest.SpyInstance;
  let analyzeProductivityTrendsSpy: jest.SpyInstance;
  let validateBatchDataQualitySpy: jest.SpyInstance;
  let verifyAnalysisResultValiditySpy: jest.SpyInstance;
  let generateOptimalPlacementRecommendationsSpy: jest.SpyInstance;
  let saveProductivityDataSpy: jest.SpyInstance;
  let saveComparisonAnalysisResultSpy: jest.SpyInstance;
  let sendAnalysisResultVerificationToManagerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('aggregatePerformanceDataForBatch がデータベース接続エラーを発生させるとき、executeDailyBatchProcess は DataAggregationFailure 例外をスロー', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const dataAggregationFailureError = new Error('作業実績データの集約に失敗しました。システム管理者に報告してください。');
    dataAggregationFailureError.name = 'DataAggregationFailure';

    aggregatePerformanceDataForBatchSpy = jest
      .spyOn(dailyBatchModule as any, 'aggregatePerformanceDataForBatch')
      .mockRejectedValue(dataAggregationFailureError);

    try {
      await executeDailyBatchProcess(input);
      fail('Expected DataAggregationFailure to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('DataAggregationFailure');
      expect(error.message).toBe('作業実績データの集約に失敗しました。システム管理者に報告してください。');
    }
  });

  it('DataAggregationFailure が発生したとき、実行ステータスが failure に設定されず、例外で中断される', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const dataAggregationFailureError = new Error('作業実績データの集約に失敗しました。システム管理者に報告してください。');
    dataAggregationFailureError.name = 'DataAggregationFailure';

    aggregatePerformanceDataForBatchSpy = jest
      .spyOn(dailyBatchModule as any, 'aggregatePerformanceDataForBatch')
      .mockRejectedValue(dataAggregationFailureError);

    let exceptionThrown = false;
    try {
      await executeDailyBatchProcess(input);
    } catch (error: any) {
      exceptionThrown = true;
      expect(error.name).toBe('DataAggregationFailure');
    }

    expect(exceptionThrown).toBe(true);
  });

  it('DataAggregationFailure が発生したとき、後続の処理（分析、検証、推奨生成、永続化、通知）は呼び出されない', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'admin-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const dataAggregationFailureError = new Error('作業実績データの集約に失敗しました。システム管理者に報告してください。');
    dataAggregationFailureError.name = 'DataAggregationFailure';

    aggregatePerformanceDataForBatchSpy = jest
      .spyOn(dailyBatchModule as any, 'aggregatePerformanceDataForBatch')
      .mockRejectedValue(dataAggregationFailureError);

    analyzeProductivityTrendsSpy = jest
      .spyOn(dailyBatchModule as any, 'analyzeProductivityTrends')
      .mockResolvedValue({} as any);

    validateBatchDataQualitySpy = jest
      .spyOn(dailyBatchModule as any, 'validateBatchDataQuality')
      .mockResolvedValue({} as any);

    verifyAnalysisResultValiditySpy = jest
      .spyOn(dailyBatchModule as any, 'verifyAnalysisResultValidity')
      .mockResolvedValue({} as any);

    generateOptimalPlacementRecommendationsSpy = jest
      .spyOn(dailyBatchModule as any, 'generateOptimalPlacementRecommendations')
      .mockResolvedValue([]);

    saveProductivityDataSpy = jest
      .spyOn(dailyBatchModule as any, 'saveProductivityData')
      .mockResolvedValue(undefined);

    saveComparisonAnalysisResultSpy = jest
      .spyOn(dailyBatchModule as any, 'saveComparisonAnalysisResult')
      .mockResolvedValue(undefined);

    sendAnalysisResultVerificationToManagerSpy = jest
      .spyOn(dailyBatchModule as any, 'sendAnalysisResultVerificationToManager')
      .mockResolvedValue(undefined);

    try {
      await executeDailyBatchProcess(input);
    } catch {
      // エラーをキャッチして検証続行
    }

    expect(analyzeProductivityTrendsSpy).not.toHaveBeenCalled();
    expect(validateBatchDataQualitySpy).not.toHaveBeenCalled();
    expect(verifyAnalysisResultValiditySpy).not.toHaveBeenCalled();
    expect(generateOptimalPlacementRecommendationsSpy).not.toHaveBeenCalled();
    expect(saveProductivityDataSpy).not.toHaveBeenCalled();
    expect(saveComparisonAnalysisResultSpy).not.toHaveBeenCalled();
    expect(sendAnalysisResultVerificationToManagerSpy).not.toHaveBeenCalled();
  });
});