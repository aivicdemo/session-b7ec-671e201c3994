import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-677: saveComparisonAnalysisResult - InvalidAnalysisDataError for out-of-range quality score', () => {
  it('should throw InvalidAnalysisDataError when averageQualityScore1 is negative', async () => {
    const input = {
      comparisonAnalysisResultId: 'CMP-001',
      analysisName: 'Test Analysis',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-001',
      comparisonTarget2: 'WORKER-002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: -5, // Out of range: negative value
      averageQualityScore2: 85,
      analysisResultSummary: 'テスト用要約',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'USER-001',
      updatedBy: undefined,
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

  it('should throw InvalidAnalysisDataError when averageQualityScore1 exceeds 100', async () => {
    const input = {
      comparisonAnalysisResultId: 'CMP-002',
      analysisName: 'Test Analysis',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-001',
      comparisonTarget2: 'WORKER-002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 105, // Out of range: exceeds 100
      averageQualityScore2: 85,
      analysisResultSummary: 'テスト用要約',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'USER-001',
      updatedBy: undefined,
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

  it('should throw InvalidAnalysisDataError when averageQualityScore2 is out of range', async () => {
    const input = {
      comparisonAnalysisResultId: 'CMP-003',
      analysisName: 'Test Analysis',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-001',
      comparisonTarget2: 'WORKER-002',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 85,
      averageQualityScore2: 150, // Out of range: exceeds 100
      analysisResultSummary: 'テスト用要約',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.05,
      createdBy: 'USER-001',
      updatedBy: undefined,
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