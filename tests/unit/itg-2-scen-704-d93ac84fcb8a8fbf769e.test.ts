import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-704: findComparisonAnalysisResultsByType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('並び順が指定されなかったとき、検索結果が降順（新しい順）で返される', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';

    const recordC = {
      comparisonAnalysisResultId: 'result-c',
      analysisName: 'Analysis C',
      analysisType: analysisType,
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'target-1',
      comparisonTarget2: 'target-2',
      averageProductivity1: 85,
      averageProductivity2: 92,
      productivityImprovementRate: 8.2,
      averageQualityScore1: 88,
      averageQualityScore2: 95,
      analysisResultSummary: 'Summary C',
      recommendedAction: 'Action C',
      statisticalSignificance: 0.95,
      createdAt: new Date('2024-01-20T09:15:00Z'),
      updatedAt: new Date('2024-01-20T09:15:00Z'),
    };

    const recordA = {
      comparisonAnalysisResultId: 'result-a',
      analysisName: 'Analysis A',
      analysisType: analysisType,
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'target-1',
      comparisonTarget2: 'target-2',
      averageProductivity1: 80,
      averageProductivity2: 88,
      productivityImprovementRate: 10.0,
      averageQualityScore1: 82,
      averageQualityScore2: 90,
      analysisResultSummary: 'Summary A',
      recommendedAction: 'Action A',
      statisticalSignificance: 0.92,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const recordB = {
      comparisonAnalysisResultId: 'result-b',
      analysisName: 'Analysis B',
      analysisType: analysisType,
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'target-1',
      comparisonTarget2: 'target-2',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.3,
      averageQualityScore1: 78,
      averageQualityScore2: 85,
      analysisResultSummary: 'Summary B',
      recommendedAction: 'Action B',
      statisticalSignificance: 0.88,
      createdAt: new Date('2024-01-10T14:30:00Z'),
      updatedAt: new Date('2024-01-10T14:30:00Z'),
    };

    jest.spyOn(persistenceLayer, 'findComparisonAnalysisResultsByType' as any).mockResolvedValue({
      comparisonAnalysisResults: [recordC, recordA, recordB],
      totalCount: 3,
      found: true,
      analysisType: analysisType,
    });

    const result = await findComparisonAnalysisResultsByType({
      analysisType: analysisType,
      requestingUserId: requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.analysisType).toBe(analysisType);
    expect(result.comparisonAnalysisResults).toHaveLength(3);

    expect(result.comparisonAnalysisResults[0].comparisonAnalysisResultId).toBe('result-c');
    expect(result.comparisonAnalysisResults[0].createdAt).toEqual(new Date('2024-01-20T09:15:00Z'));

    expect(result.comparisonAnalysisResults[1].comparisonAnalysisResultId).toBe('result-a');
    expect(result.comparisonAnalysisResults[1].createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));

    expect(result.comparisonAnalysisResults[2].comparisonAnalysisResultId).toBe('result-b');
    expect(result.comparisonAnalysisResults[2].createdAt).toEqual(new Date('2024-01-10T14:30:00Z'));
  });
});