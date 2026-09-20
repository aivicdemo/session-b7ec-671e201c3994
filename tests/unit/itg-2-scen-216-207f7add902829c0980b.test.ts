import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import {
  VerifyAndScoreAnalysisResultInput,
  AnalysisResultData,
  VerifyAndScoreAnalysisResultOutput,
} from '../../src/logic/analysis-result-verification';

jest.mock('../../src/logic/authorization-and-validation.ts');
jest.mock('../../src/logic/persistence-layer.ts');

import * as authValidation from '../../src/logic/authorization-and-validation';
import * as persistenceLayer from '../../src/logic/persistence-layer.ts';

describe('SCEN-216: 妥当性スコアが70以上のときapprovalRecommendationがAPPROVEDになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('妥当性スコアが70以上のときapprovalRecommendationはAPPROVEDになる', async () => {
    // 1. 入力データを準備
    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'W-123',
      teamId: 'T-45',
      siteId: 'S-789',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USER-999',
      analysisResultData: {
        averageProductivity: 95,
        averageQualityScore: 92,
        proficiencyLevel: '上級',
        errorRate: 5,
        recommendedAction: '現在のパフォーマンスを維持し、チーム内での指導的役割を検討',
      },
    };

    // 2. analysisResultDataを構成
    // benchmarkVariance=0.10（±10%以内）
    // pastVariance=0.15（±15%以内）
    // ruleCompliance=true
    const analysisResultData: AnalysisResultData = input.analysisResultData;

    // 3. validateInputDataをスタブ化
    (authValidation.validateInputData as jest.Mock).mockResolvedValue(true);

    // 4. 過去実績データを返すスタブ
    (persistenceLayer.findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      { date: '2023-10-01', productivity: 90, qualityScore: 90 },
      { date: '2023-11-01', productivity: 92, qualityScore: 91 },
      { date: '2023-12-01', productivity: 93, qualityScore: 92 },
    ]);

    (persistenceLayer.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue([
      { date: '2023-10-01', avgProductivity: 85, avgQualityScore: 88 },
      { date: '2023-11-01', avgProductivity: 86, avgQualityScore: 89 },
      { date: '2023-12-01', avgProductivity: 87, avgQualityScore: 90 },
    ]);

    (persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock).mockResolvedValue([
      { date: '2023-10-01', avgProductivity: 80, avgQualityScore: 85 },
      { date: '2023-11-01', avgProductivity: 81, avgQualityScore: 86 },
      { date: '2023-12-01', avgProductivity: 82, avgQualityScore: 87 },
    ]);

    // 5. verifyAndScoreAnalysisResultを呼び出し
    const result: VerifyAndScoreAnalysisResultOutput = await verifyAndScoreAnalysisResult(input);

    // 6. 期待結果を検証
    // (1) validityScore=100
    expect(result.validityScore).toBe(100);

    // (2) approvalRecommendation='APPROVED'（スコア70以上のため）
    expect(result.approvalRecommendation).toBe('APPROVED');

    // (3) validityJudgmentReasonに過去実績比較・業界標準比較・センター固有ルールの適合状況が説明される
    expect(result.validityJudgmentReason).toBeDefined();
    expect(typeof result.validityJudgmentReason).toBe('string');
    expect(result.validityJudgmentReason.length).toBeGreaterThan(0);

    // (4) businessRuleComplianceDetailsに各ルールの適合状況とスコア寄与度が含まれる
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThan(0);
    result.businessRuleComplianceDetails.forEach((detail) => {
      expect(detail.ruleId).toBeDefined();
      expect(detail.ruleName).toBeDefined();
      expect(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).toContain(detail.complianceStatus);
      expect(detail.scoreContribution).toBeGreaterThanOrEqual(0);
      expect(detail.scoreContribution).toBeLessThanOrEqual(100);
      expect(detail.details).toBeDefined();
    });

    // (5) historicalPerformanceComparisonに過去実績との差分が±15%以内として示される
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.workerProductivityTrend).toMatch(
      /^(IMPROVING|STABLE|DECLINING)$/
    );
    expect(result.historicalPerformanceComparison.teamHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.siteHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.workerVsTeamDifference).toBeDefined();
    expect(result.historicalPerformanceComparison.workerVsSiteDifference).toBeDefined();

    // (6) industryStandardComparisonに業界標準との乖離度が±10%以内として示される
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBeDefined();
    expect(result.industryStandardComparison.industryStandardQuality).toBeDefined();
    expect(result.industryStandardComparison.productivityVsStandard).toBeDefined();
    expect(result.industryStandardComparison.qualityVsStandard).toBeDefined();
    expect(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE']).toContain(
      result.industryStandardComparison.evaluationLevel
    );

    // (7) flagsForReviewは空配列または未含（スコア70以上のため）
    if (result.flagsForReview !== undefined) {
      expect(Array.isArray(result.flagsForReview)).toBe(true);
      expect(result.flagsForReview.length).toBe(0);
    }

    // (8) verificationTimestampに検証実行日時がISO 8601形式で記録される
    expect(result.verificationTimestamp).toBeDefined();
    expect(typeof result.verificationTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.verificationTimestamp)).toBe(true);
  });
});