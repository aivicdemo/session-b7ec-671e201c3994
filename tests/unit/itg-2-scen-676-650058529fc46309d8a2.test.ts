import { saveComparisonAnalysisResult, InvalidAnalysisDataError } from '../../src/logic/persistence-layer';

describe('SCEN-676: 比較分析結果の保存 - 平均生産性率が0～100の範囲外の場合', () => {
  it('averageProductivity1が-5（0未満）の場合、InvalidAnalysisDataErrorが発生する', async () => {
    const input = {
      comparisonAnalysisResultId: 'CSAR-001',
      analysisName: '初期割当実績比較',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-001',
      comparisonTarget2: 'WORKER-002',
      averageProductivity1: -5,
      averageProductivity2: 50,
      productivityImprovementRate: 10,
      averageQualityScore1: 85,
      averageQualityScore2: 80,
      analysisResultSummary: '分析結果',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'USER-001',
      requestingUserId: 'USER-001',
      operation: 'create' as const,
    };

    const expectedErrorMessage =
      '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。';

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      InvalidAnalysisDataError
    );

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      expectedErrorMessage
    );
  });
});