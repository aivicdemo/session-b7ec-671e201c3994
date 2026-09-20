import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-686: updatedByが未指定で更新操作を実行した場合', () => {
  it('should successfully save comparison analysis result when updatedBy is undefined during update operation', async () => {
    const input = {
      comparisonAnalysisResultId: 'CAR-001',
      analysisName: '初期配置実績比較',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-A',
      comparisonTarget2: 'WORKER-B',
      averageProductivity1: 85.0,
      averageProductivity2: 78.5,
      productivityImprovementRate: 8.2,
      averageQualityScore1: 92.0,
      averageQualityScore2: 88.5,
      analysisResultSummary: '配置変更による生産性向上が確認された',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.042,
      createdBy: 'USER-001',
      updatedBy: undefined,
      requestingUserId: 'USER-001',
      operation: 'update' as const,
    };

    const result = await saveComparisonAnalysisResult(input);

    expect(result.success).toBe(true);
    expect(result.comparisonAnalysisResultId).toBe('CAR-001');
    expect(result.operation).toBe('update');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThan(0);
    expect(result.message).toBeUndefined();
  });
});