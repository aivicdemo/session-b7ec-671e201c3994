import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import type {
  VerifyAndScoreAnalysisResultInput,
  VerifyAndScoreAnalysisResultOutput,
  AnalysisResultData,
} from '../../src/logic/analysis-result-verification';

describe('SCEN-215: 検証処理はセンター固有ルール未定義時も継続実行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('センター固有ルールが空配列の場合、検証は継続実行され妥当性スコアが返却される', async () => {
    // ステップ1: 入力データを準備（センター固有ルールなし）
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 100,
      averageQualityScore: 85,
      proficiencyLevel: '3',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'W-001',
      teamId: 'T-001',
      siteId: 'S-001',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-001',
    };

    // ステップ3: 関数を呼び出す
    const result: VerifyAndScoreAnalysisResultOutput =
      await verifyAndScoreAnalysisResult(input);

    // ステップ4: 出力を検証

    // (1) validityScoreが0～100の数値で返却される
    expect(result.validityScore).toBeDefined();
    expect(typeof result.validityScore).toBe('number');
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    // (2) businessRuleComplianceDetailsが空配列またはセンター固有ルール検証項目なしの状態で返却される
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBe(0);

    // (3) historicalPerformanceComparisonが過去実績の差分と傾向を含めて返却される
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.workerHistoricalAverage).toBe('number');
    expect(result.historicalPerformanceComparison.workerProductivityTrend).toBeDefined();
    expect(['IMPROVING', 'STABLE', 'DECLINING']).toContain(
      result.historicalPerformanceComparison.workerProductivityTrend
    );
    expect(result.historicalPerformanceComparison.teamHistoricalAverage).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.teamHistoricalAverage).toBe('number');
    expect(result.historicalPerformanceComparison.siteHistoricalAverage).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.siteHistoricalAverage).toBe('number');
    expect(result.historicalPerformanceComparison.workerVsTeamDifference).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.workerVsTeamDifference).toBe('number');
    expect(result.historicalPerformanceComparison.workerVsSiteDifference).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.workerVsSiteDifference).toBe('number');

    // (4) industryStandardComparisonが業界標準値との乖離度と評価レベルを含めて返却される
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBeDefined();
    expect(typeof result.industryStandardComparison.industryStandardProductivity).toBe('number');
    expect(result.industryStandardComparison.industryStandardQuality).toBeDefined();
    expect(typeof result.industryStandardComparison.industryStandardQuality).toBe('number');
    expect(result.industryStandardComparison.productivityVsStandard).toBeDefined();
    expect(typeof result.industryStandardComparison.productivityVsStandard).toBe('number');
    expect(result.industryStandardComparison.qualityVsStandard).toBeDefined();
    expect(typeof result.industryStandardComparison.qualityVsStandard).toBe('number');
    expect(result.industryStandardComparison.evaluationLevel).toBeDefined();
    expect(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE']).toContain(
      result.industryStandardComparison.evaluationLevel
    );

    // (5) validityJudgmentReasonにセンター固有ルール未定義についての説明が含まれる
    expect(result.validityJudgmentReason).toBeDefined();
    expect(typeof result.validityJudgmentReason).toBe('string');
    expect(result.validityJudgmentReason.length).toBeGreaterThan(0);
    expect(result.validityJudgmentReason).toContain('スキップ');
    expect(result.validityJudgmentReason).toContain('過去実績');
    expect(result.validityJudgmentReason).toContain('業界標準');

    // (6) approvalRecommendationがスコアに基づいて判定される
    expect(result.approvalRecommendation).toBeDefined();
    expect(['APPROVED', 'REQUIRES_REVIEW']).toContain(result.approvalRecommendation);

    // (7) verificationTimestampが現在時刻のISO 8601形式で返却される
    expect(result.verificationTimestamp).toBeDefined();
    expect(typeof result.verificationTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.verificationTimestamp)).toBe(true);
  });

  it('センター固有ルールがnullの場合、検証は継続実行され妥当性スコアが返却される', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 100,
      averageQualityScore: 85,
      proficiencyLevel: '3',
      errorRate: 5,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-002',
      workerId: 'W-002',
      teamId: 'T-002',
      siteId: 'S-002',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-002',
    };

    const result: VerifyAndScoreAnalysisResultOutput =
      await verifyAndScoreAnalysisResult(input);

    expect(result.validityScore).toBeDefined();
    expect(typeof result.validityScore).toBe('number');
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    expect(result.approvalRecommendation).toBeDefined();
    expect(['APPROVED', 'REQUIRES_REVIEW']).toContain(result.approvalRecommendation);

    expect(result.validityJudgmentReason).toBeDefined();
    expect(result.validityJudgmentReason.length).toBeGreaterThan(0);
    expect(result.validityJudgmentReason).toContain('スキップ');
    expect(result.validityJudgmentReason).toContain('過去実績');
    expect(result.validityJudgmentReason).toContain('業界標準');

    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.industryStandardComparison).toBeDefined();

    expect(result.verificationTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.verificationTimestamp)).toBe(true);
  });

  it('妥当性スコアが70以上の場合、approvalRecommendationはAPPROVEDで返却される', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 95,
      averageQualityScore: 90,
      proficiencyLevel: '3',
      errorRate: 3,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-003',
      workerId: 'W-003',
      teamId: 'T-003',
      siteId: 'S-003',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-003',
    };

    const result: VerifyAndScoreAnalysisResultOutput =
      await verifyAndScoreAnalysisResult(input);

    expect(result.validityScore).toBeGreaterThanOrEqual(70);
    expect(result.approvalRecommendation).toBe('APPROVED');
  });

  it('妥当性スコアが70未満の場合、approvalRecommendationはREQUIRES_REVIEWで返却される', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 40,
      averageQualityScore: 50,
      proficiencyLevel: '1',
      errorRate: 25,
      recommendedAction: '指導が必要',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-004',
      workerId: 'W-004',
      teamId: 'T-004',
      siteId: 'S-004',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-004',
    };

    const result: VerifyAndScoreAnalysisResultOutput =
      await verifyAndScoreAnalysisResult(input);

    expect(result.validityScore).toBeLessThan(70);
    expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');
  });
});