import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';

describe('SCEN-694: 指定された分析タイプに合致する比較分析結果を時系列で一覧取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された分析タイプに該当する比較分析結果レコードを検索し、同一タイプの分析結果を時系列で一覧取得する', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';

    const result = await findComparisonAnalysisResultsByType({
      analysisType: analysisType,
      sortOrder: 'desc',
      requestingUserId: requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.analysisType).toBe('初期割当実績比較');
    expect(result.comparisonAnalysisResults).toHaveLength(3);

    expect(result.comparisonAnalysisResults[0].comparisonAnalysisResultId).toBe('rec-003');
    expect(result.comparisonAnalysisResults[1].comparisonAnalysisResultId).toBe('rec-001');
    expect(result.comparisonAnalysisResults[2].comparisonAnalysisResultId).toBe('rec-002');

    expect(result.comparisonAnalysisResults[0].createdAt.getTime()).toBeGreaterThan(
      result.comparisonAnalysisResults[1].createdAt.getTime()
    );
    expect(result.comparisonAnalysisResults[1].createdAt.getTime()).toBeGreaterThan(
      result.comparisonAnalysisResults[2].createdAt.getTime()
    );

    result.comparisonAnalysisResults.forEach((record) => {
      expect(record.analysisType).toBe('初期割当実績比較');
      expect(record.comparisonAnalysisResultId).toBeDefined();
      expect(record.analysisName).toBeDefined();
      expect(record.targetPeriodStartDate).toBeDefined();
      expect(record.targetPeriodEndDate).toBeDefined();
      expect(record.averageProductivity1).toBeDefined();
      expect(record.averageProductivity2).toBeDefined();
      expect(record.productivityImprovementRate).toBeDefined();
      expect(record.averageQualityScore1).toBeDefined();
      expect(record.averageQualityScore2).toBeDefined();
    });
  });

  it('分析タイプ=配置変更効果測定の場合、異なる分析タイプのレコードは含まれない', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '配置変更効果測定';

    const result = await findComparisonAnalysisResultsByType({
      analysisType: analysisType,
      sortOrder: 'desc',
      requestingUserId: requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(1);
    expect(result.analysisType).toBe('配置変更効果測定');
    expect(result.comparisonAnalysisResults).toHaveLength(1);
    expect(result.comparisonAnalysisResults[0].analysisType).toBe('配置変更効果測定');
  });

  it('sortOrder=ascの場合、結果が昇順で返される', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';

    const result = await findComparisonAnalysisResultsByType({
      analysisType: analysisType,
      sortOrder: 'asc',
      requestingUserId: requestingUserId,
    });

    expect(result.comparisonAnalysisResults).toHaveLength(3);
    expect(result.comparisonAnalysisResults[0].comparisonAnalysisResultId).toBe('rec-002');
    expect(result.comparisonAnalysisResults[1].comparisonAnalysisResultId).toBe('rec-001');
    expect(result.comparisonAnalysisResults[2].comparisonAnalysisResultId).toBe('rec-003');

    expect(result.comparisonAnalysisResults[0].createdAt.getTime()).toBeLessThan(
      result.comparisonAnalysisResults[1].createdAt.getTime()
    );
    expect(result.comparisonAnalysisResults[1].createdAt.getTime()).toBeLessThan(
      result.comparisonAnalysisResults[2].createdAt.getTime()
    );
  });

  it('該当する分析タイプのレコードが存在しない場合、found=falseが返される', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '存在しない分析タイプ';

    const result = await findComparisonAnalysisResultsByType({
      analysisType: analysisType,
      sortOrder: 'desc',
      requestingUserId: requestingUserId,
    });

    expect(result.found).toBe(false);
    expect(result.totalCount).toBe(0);
    expect(result.comparisonAnalysisResults).toHaveLength(0);
  });
});