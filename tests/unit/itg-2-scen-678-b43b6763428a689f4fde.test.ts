import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-678: 統計的有意性（p値）が0～1の範囲外の場合、InvalidAnalysisDataErrorが発生する', () => {
  it('should throw InvalidAnalysisDataError when statisticalSignificance is negative', async () => {
    const input = {
      comparisonAnalysisResultId: 'CAR-001',
      analysisName: '比較分析-001',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'worker-001',
      comparisonTarget2: 'worker-002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 88,
      averageQualityScore2: 91,
      analysisResultSummary: '比較結果の要約',
      recommendedAction: '配置継続',
      statisticalSignificance: -0.05,
      createdBy: 'user-123',
      requestingUserId: 'user-123',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAnalysisDataError',
        message: '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。',
      })
    );
  });

  it('should throw InvalidAnalysisDataError when statisticalSignificance exceeds 1', async () => {
    const input = {
      comparisonAnalysisResultId: 'CAR-002',
      analysisName: '比較分析-002',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'worker-001',
      comparisonTarget2: 'worker-002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 88,
      averageQualityScore2: 91,
      analysisResultSummary: '比較結果の要約',
      recommendedAction: '配置継続',
      statisticalSignificance: 1.5,
      createdBy: 'user-123',
      requestingUserId: 'user-123',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAnalysisDataError',
        message: '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。',
      })
    );
  });
});