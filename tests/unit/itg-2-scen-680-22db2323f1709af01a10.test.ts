import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-680: saveComparisonAnalysisResult - Authorization Error', () => {
  it('should throw UnauthorizedPersistenceError when user lacks save permission', async () => {
    const input = {
      comparisonAnalysisResultId: 'CAR-001',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'WORKER-001',
      comparisonTarget2: 'WORKER-002',
      averageProductivity1: 85.0,
      averageProductivity2: 78.5,
      productivityImprovementRate: 8.2,
      averageQualityScore1: 92.0,
      averageQualityScore2: 89.5,
      analysisResultSummary: '配置変更により生産性が改善',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.032,
      createdBy: 'ADMIN-001',
      requestingUserId: 'USER-WITHOUT-PERMISSION',
      operation: 'create' as const,
    };

    try {
      await saveComparisonAnalysisResult(input);
      fail('Expected UnauthorizedPersistenceError to be thrown');
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      expect(err.name).toBe('UnauthorizedPersistenceError');
      expect(err.message).toBe('このユーザーは比較分析結果を保存する権限がありません。');
    }
  });
});