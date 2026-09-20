import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-675: saveComparisonAnalysisResult - InvalidAnalysisDataError when start date is after end date', () => {
  it('should throw InvalidAnalysisDataError when targetPeriodStartDate is after targetPeriodEndDate', async () => {
    const input = {
      comparisonAnalysisResultId: 'analysis-001',
      analysisName: '配置変更前後比較',
      analysisType: '配置変更前後比較',
      targetPeriodStartDate: new Date('2024-01-15'),
      targetPeriodEndDate: new Date('2024-01-10'),
      comparisonTarget1: 'worker-A',
      comparisonTarget2: 'worker-B',
      averageProductivity1: 85,
      averageProductivity2: 90,
      productivityImprovementRate: 5.9,
      averageQualityScore1: 88,
      averageQualityScore2: 92,
      analysisResultSummary: '配置変更により生産性が5.9%改善した',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.03,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。'
    );
  });
});