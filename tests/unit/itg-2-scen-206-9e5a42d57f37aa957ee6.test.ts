import {
  verifyAndScoreAnalysisResult,
  VerifyAndScoreAnalysisResultInput,
  AnalysisResultData,
} from '../../src/logic/analysis-result-verification';

describe('SCEN-206: 代表的な正常入力で妥当性スコアと判定理由が正常に生成される', () => {
  it('正常入力データで妥当性スコアと判定理由が正常に生成される', async () => {
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 95,
      averageQualityScore: 98,
      proficiencyLevel: '上級',
      errorRate: 2,
      recommendedAction: '現状維持',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'W-001',
      teamId: 'T-001',
      siteId: 'S-001',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-001',
    };

    const result = await verifyAndScoreAnalysisResult(input);

    expect(result.validityScore).toBe(100);
    expect(result.approvalRecommendation).toBe('APPROVED');

    expect(result.validityJudgmentReason).toContain('過去実績');
    expect(result.validityJudgmentReason).toContain('業界標準');
    expect(result.validityJudgmentReason).toContain('ルール');
    expect(result.validityJudgmentReason).toContain('基準内');
    expect(result.validityJudgmentReason).toContain('100');
    expect(result.validityJudgmentReason).toContain('承認推奨');

    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThanOrEqual(1);

    result.businessRuleComplianceDetails.forEach((detail) => {
      expect(detail.ruleId).toBeDefined();
      expect(detail.ruleName).toBeDefined();
      expect(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).toContain(
        detail.complianceStatus
      );
      expect(typeof detail.scoreContribution).toBe('number');
      expect(detail.scoreContribution).toBeGreaterThanOrEqual(0);
      expect(detail.scoreContribution).toBeLessThanOrEqual(100);
      expect(detail.details).toBeDefined();
    });

    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(
      typeof result.historicalPerformanceComparison.workerHistoricalAverage
    ).toBe('number');
    expect(['IMPROVING', 'STABLE', 'DECLINING']).toContain(
      result.historicalPerformanceComparison.workerProductivityTrend
    );
    expect(
      typeof result.historicalPerformanceComparison.teamHistoricalAverage
    ).toBe('number');
    expect(
      typeof result.historicalPerformanceComparison.siteHistoricalAverage
    ).toBe('number');

    const workerVsTeamDiff = Math.abs(
      result.historicalPerformanceComparison.workerVsTeamDifference
    );
    const workerVsSiteDiff = Math.abs(
      result.historicalPerformanceComparison.workerVsSiteDifference
    );
    expect(workerVsTeamDiff).toBeLessThanOrEqual(15);
    expect(workerVsSiteDiff).toBeLessThanOrEqual(15);

    expect(result.industryStandardComparison).toBeDefined();
    expect(
      typeof result.industryStandardComparison.industryStandardProductivity
    ).toBe('number');
    expect(typeof result.industryStandardComparison.industryStandardQuality).toBe(
      'number'
    );

    const productivityDiff = Math.abs(
      result.industryStandardComparison.productivityVsStandard
    );
    const qualityDiff = Math.abs(
      result.industryStandardComparison.qualityVsStandard
    );
    expect(productivityDiff).toBeLessThanOrEqual(12);
    expect(qualityDiff).toBeLessThanOrEqual(12);

    expect(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE']).toContain(
      result.industryStandardComparison.evaluationLevel
    );

    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview.length).toBe(0);

    expect(result.verificationTimestamp).toBeDefined();
    const timestampDate = new Date(result.verificationTimestamp);
    expect(timestampDate.toString()).not.toBe('Invalid Date');
    expect(result.verificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});