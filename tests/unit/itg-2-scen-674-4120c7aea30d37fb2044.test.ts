import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-674: 分析タイプが不正な値の場合、InvalidAnalysisDataErrorが発生する', () => {
  it('analysisTypeが空文字列の場合、InvalidAnalysisDataErrorをスロー', async () => {
    const input = {
      comparisonAnalysisResultId: 'CA-001',
      analysisName: 'テスト比較分析',
      analysisType: '',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'W001',
      comparisonTarget2: 'W002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 88,
      averageQualityScore2: 91,
      analysisResultSummary: '比較結果',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'U001',
      requestingUserId: 'U001',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow('InvalidAnalysisDataError');
    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。'
    );
  });

  it('analysisTypeがnullの場合、InvalidAnalysisDataErrorをスロー', async () => {
    const input = {
      comparisonAnalysisResultId: 'CA-001',
      analysisName: 'テスト比較分析',
      analysisType: null as any,
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'W001',
      comparisonTarget2: 'W002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 88,
      averageQualityScore2: 91,
      analysisResultSummary: '比較結果',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'U001',
      requestingUserId: 'U001',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow('InvalidAnalysisDataError');
    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。'
    );
  });

  it('analysisTypeがundefinedの場合、InvalidAnalysisDataErrorをスロー', async () => {
    const input = {
      comparisonAnalysisResultId: 'CA-001',
      analysisName: 'テスト比較分析',
      analysisType: undefined as any,
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'W001',
      comparisonTarget2: 'W002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 88,
      averageQualityScore2: 91,
      analysisResultSummary: '比較結果',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'U001',
      requestingUserId: 'U001',
      operation: 'create' as const,
    };

    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow('InvalidAnalysisDataError');
    await expect(saveComparisonAnalysisResult(input)).rejects.toThrow(
      '比較分析結果の入力データが不正です。分析タイプ、対象期間、比較対象、数値範囲、統計的有意性を確認してください。'
    );
  });
});