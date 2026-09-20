import { saveComparisonAnalysisResult } from '../../src/logic/persistence-layer';

describe('SCEN-687: saveComparisonAnalysisResult with optional message field', () => {
  it('should successfully save comparison analysis result when message is undefined', async () => {
    const input = {
      comparisonAnalysisResultId: 'comp-001',
      analysisName: 'test-analysis',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'worker-001',
      comparisonTarget2: 'worker-002',
      averageProductivity1: 85,
      averageProductivity2: 78,
      productivityImprovementRate: 8.97,
      averageQualityScore1: 92,
      averageQualityScore2: 88,
      analysisResultSummary: 'worker-001 shows better performance',
      recommendedAction: '配置継続',
      statisticalSignificance: 0.045,
      createdBy: 'admin-001',
      updatedBy: undefined,
      requestingUserId: 'admin-001',
      operation: 'create' as const,
      message: undefined,
    };

    const result = await saveComparisonAnalysisResult(input);

    expect(result.success).toBe(true);
    expect(result.comparisonAnalysisResultId).toBe('comp-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });
});