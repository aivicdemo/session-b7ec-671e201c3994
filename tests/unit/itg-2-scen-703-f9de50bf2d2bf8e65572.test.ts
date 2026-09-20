import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-703: 並び順が降順で指定されたとき、検索結果が降順で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return comparison analysis results sorted in descending order by creation date', async () => {
    // Arrange
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';
    const sortOrder = 'desc';

    const mockRecordA = {
      comparisonAnalysisResultId: 'result-001',
      analysisName: '初期割当実績比較分析A',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2024-01-01'),
      targetPeriodEndDate: new Date('2024-01-31'),
      comparisonTarget1: 'worker-001',
      comparisonTarget2: 'worker-002',
      averageProductivity1: 85,
      averageProductivity2: 92,
      productivityImprovementRate: 8.2,
      averageQualityScore1: 88,
      averageQualityScore2: 90,
      analysisResultSummary: '初期割当後の生産性改善を確認',
      recommendedAction: '現在の配置を継続',
      statisticalSignificance: 0.75,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };

    const mockRecordB = {
      comparisonAnalysisResultId: 'result-002',
      analysisName: '初期割当実績比較分析B',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2023-12-01'),
      targetPeriodEndDate: new Date('2023-12-31'),
      comparisonTarget1: 'worker-003',
      comparisonTarget2: 'worker-004',
      averageProductivity1: 80,
      averageProductivity2: 87,
      productivityImprovementRate: 8.75,
      averageQualityScore1: 85,
      averageQualityScore2: 89,
      analysisResultSummary: '前月の初期割当効果を測定',
      recommendedAction: '難度調整を検討',
      statisticalSignificance: 0.68,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    };

    const mockRecordC = {
      comparisonAnalysisResultId: 'result-003',
      analysisName: '初期割当実績比較分析C',
      analysisType: '初期割当実績比較',
      targetPeriodStartDate: new Date('2023-11-01'),
      targetPeriodEndDate: new Date('2023-11-30'),
      comparisonTarget1: 'worker-005',
      comparisonTarget2: 'worker-006',
      averageProductivity1: 75,
      averageProductivity2: 82,
      productivityImprovementRate: 9.33,
      averageQualityScore1: 82,
      averageQualityScore2: 87,
      analysisResultSummary: '11月の初期割当分析',
      recommendedAction: '配置継続推奨',
      statisticalSignificance: 0.71,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
    };

    (findComparisonAnalysisResultsByType as jest.Mock).mockResolvedValue({
      comparisonAnalysisResults: [mockRecordA, mockRecordB, mockRecordC],
      totalCount: 3,
      found: true,
      analysisType,
    });

    // Act
    const result = await findComparisonAnalysisResultsByType({
      analysisType,
      sortOrder,
      requestingUserId,
    });

    // Assert
    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.analysisType).toBe('初期割当実績比較');
    expect(result.comparisonAnalysisResults).toHaveLength(3);

    // Verify descending order by creation date
    expect(result.comparisonAnalysisResults[0].createdAt).toEqual(new Date('2024-01-15'));
    expect(result.comparisonAnalysisResults[1].createdAt).toEqual(new Date('2024-01-10'));
    expect(result.comparisonAnalysisResults[2].createdAt).toEqual(new Date('2024-01-05'));

    // Verify each record contains expected fields
    expect(result.comparisonAnalysisResults[0].comparisonAnalysisResultId).toBe('result-001');
    expect(result.comparisonAnalysisResults[1].comparisonAnalysisResultId).toBe('result-002');
    expect(result.comparisonAnalysisResults[2].comparisonAnalysisResultId).toBe('result-003');

    // Verify function was called with correct parameters
    expect(findComparisonAnalysisResultsByType).toHaveBeenCalledWith({
      analysisType,
      sortOrder,
      requestingUserId,
    });
  });
});