import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-679: 比較分析結果の保存 - 比較対象が空文字列の場合', () => {
  it('comparisonTarget2が空文字列の場合、InvalidAnalysisDataErrorが発生する', async () => {
    const input = {
      comparisonAnalysisResultId: 'CA-679-001',
      analysisName: '比較テスト',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-001',
      comparisonTarget2: '',
      averageProductivity1: 75.5,
      averageProductivity2: 80.0,
      productivityImprovementRate: 5.5,
      averageQualityScore1: 85.0,
      averageQualityScore2: 88.0,
      analysisResultSummary: '比較結果',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'USER-001',
      requestingUserId: 'USER-001',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAnalysisDataError',
        message: expect.stringContaining(
          '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。'
        ),
      })
    );
  });
});