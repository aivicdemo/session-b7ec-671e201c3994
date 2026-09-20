import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import {
  VerifyAndScoreAnalysisResultInput,
  AnalysisResultData,
} from '../../src/logic/analysis-result-verification';

describe('SCEN-219: 過去実績の平均値から±20%以内の乖離は高いスコア寄与度を得る', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('過去実績平均値から+15%の推奨生産性に対して、妥当性スコア70以上とAPPROVED判定を返す', async () => {
    // Arrange
    const testAnalysisResultId = 'test-analysis-result-001';
    const testWorkerId = 'test-worker-001';
    const testTeamId = 'test-team-001';
    const testSiteId = 'test-site-001';
    const testExecutorUserId = 'test-executor-001';

    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-03-31';
    const comparisonPeriodMonths = 3;

    // 過去3ヶ月の平均生産性を100とし、推奨生産性を+15%に設定
    const pastAverageProductivity = 100;
    const recommendedProductivity = Math.round(pastAverageProductivity * 1.15); // 115

    const analysisResultData: AnalysisResultData = {
      averageProductivity: recommendedProductivity,
      averageQualityScore: 85,
      proficiencyLevel: '中級',
      errorRate: 5,
      recommendedAction: 'スキルアップ研修の継続',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: testAnalysisResultId,
      workerId: testWorkerId,
      teamId: testTeamId,
      siteId: testSiteId,
      analysisResultData,
      analysisStartDate,
      analysisEndDate,
      comparisonPeriodMonths,
      executorUserId: testExecutorUserId,
    };

    // Act
    const result = await verifyAndScoreAnalysisResult(input);

    // Assert
    expect(result).toBeDefined();

    // validityScore が 70 以上であることを確認
    expect(result.validityScore).toBeGreaterThanOrEqual(70);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    // approvalRecommendation が 'APPROVED' であることを確認
    expect(result.approvalRecommendation).toBe('APPROVED');

    // validityJudgmentReason に過去実績比較に関する文言が含まれることを確認
    // 『過去実績の平均値から±20%以内に収まっている』または『妥当性が確認された』などの文言
    expect(
      result.validityJudgmentReason.includes('±20%以内') ||
        result.validityJudgmentReason.includes('妥当性が確認') ||
        result.validityJudgmentReason.includes('過去実績')
    ).toBe(true);

    // businessRuleComplianceDetails が配列で存在することを確認
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThan(0);

    // 過去実績比較ルール（br-tx_2-003）を検索
    const pastRuleDetail = result.businessRuleComplianceDetails.find(
      (detail) => detail.ruleId === 'br-tx_2-003' || detail.ruleName.includes('過去実績')
    );
    expect(pastRuleDetail).toBeDefined();

    // 過去実績ルールの詳細を検証
    if (pastRuleDetail) {
      // 乖離度が ±20% 以内（実際は 15%）のため、pastScore = 100 で complianceStatus = 'COMPLIANT'
      expect(pastRuleDetail.complianceStatus).toBe('COMPLIANT');
      // 寄与度が 40% であることを確認
      expect(pastRuleDetail.scoreContribution).toBe(40);
      // 詳細説明に乖離度に関する情報が含まれることを確認
      expect(pastRuleDetail.details).toBeDefined();
    }

    // historicalPerformanceComparison の検証
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBe(
      pastAverageProductivity
    );
    expect(result.historicalPerformanceComparison.workerProductivityTrend).toBe('IMPROVING');

    // 乖離度の計算と確認
    const pastAverage = result.historicalPerformanceComparison.workerHistoricalAverage;
    const calculatedDeviation = recommendedProductivity - pastAverage;
    const deviationPercent = Math.abs(calculatedDeviation) / pastAverage;

    // 乖離度が ±20% 以内（実際は 15%）であることを確認
    expect(deviationPercent).toBeLessThanOrEqual(0.2);
    expect(deviationPercent).toBe(0.15);

    // workerVsTeamDifference と workerVsSiteDifference が出力に含まれることを確認
    expect(result.historicalPerformanceComparison.workerVsTeamDifference).toBeDefined();
    expect(result.historicalPerformanceComparison.workerVsSiteDifference).toBeDefined();
    expect(result.historicalPerformanceComparison.teamHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.siteHistoricalAverage).toBeDefined();

    // 業界標準との比較結果の検証
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBeDefined();
    expect(result.industryStandardComparison.industryStandardQuality).toBeDefined();
    expect(result.industryStandardComparison.productivityVsStandard).toBeDefined();
    expect(result.industryStandardComparison.qualityVsStandard).toBeDefined();
    expect(result.industryStandardComparison.evaluationLevel).toBeDefined();

    // 業務ルール br-tx_2-003 の計算式の検証
    // pastVariance = 0.15（±20%以内のため pastScore = 100）
    // validityScore = Math.round(pastScore * 0.4 + benchmarkScore * 0.35 + ruleScore * 0.25)
    // pastScore = 100 が 40% 寄与する場合の最小スコアは 40 点

    const pastScoreContribution = 100 * 0.4; // 40 点
    const actualScore = result.validityScore;

    // validityScore >= 70 であれば、残り 30 点以上が benchmarkScore と ruleScore から寄与
    expect(actualScore).toBeGreaterThanOrEqual(70);

    // benchmarkScore と ruleScore の加重平均を逆算
    const remainingWeight = 0.35 + 0.25; // 0.6
    const remainingScoreContribution = actualScore - pastScoreContribution;
    const averageOfBenchmarkAndRule = remainingScoreContribution / remainingWeight;

    // benchmarkScore と ruleScore の平均が 50 点以上である必要がある（70 - 40 = 30、30 / 0.6 = 50）
    expect(averageOfBenchmarkAndRule).toBeGreaterThanOrEqual(50);

    // businessRuleComplianceDetails 全体で加重値が適切に計算されていることを確認
    // （各ルールの scoreContribution の合計が 100 に近い、または適切な加重構造）
    const totalContribution = result.businessRuleComplianceDetails.reduce(
      (sum, detail) => sum + detail.scoreContribution,
      0
    );
    expect(totalContribution).toBeGreaterThan(0);

    // flagsForReview が空配列であることを確認（スコア 70 以上のため）
    if (result.flagsForReview !== undefined) {
      expect(Array.isArray(result.flagsForReview)).toBe(true);
      // 要確認フラグが立たないことを確認
      if (result.flagsForReview.length > 0) {
        // スコア 70 以上の場合、HIGH または MEDIUM の重要度フラグはないことを確認
        const hasHighOrMediumFlag = result.flagsForReview.some(
          (flag) => flag.severity === 'HIGH' || flag.severity === 'MEDIUM'
        );
        expect(hasHighOrMediumFlag).toBe(false);
      } else {
        expect(result.flagsForReview).toEqual([]);
      }
    }

    // verificationTimestamp が ISO 8601 形式の有効な日時であることを確認
    expect(result.verificationTimestamp).toBeDefined();
    const timestamp = new Date(result.verificationTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();
    expect(result.verificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});