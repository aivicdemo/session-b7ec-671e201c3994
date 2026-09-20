import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { jest } from '@jest/globals';

describe('SCEN-217: 妥当性スコアが70未満のときapprovalRecommendationがREQUIRES_REVIEWになる', () => {
  it('妥当性スコアが70以上のときapprovalRecommendationがAPPROVEDになることを検証する', async () => {
    const input = {
      analysisResultId: 'AR-001',
      workerId: 'W-001',
      teamId: 'T-001',
      siteId: 'S-001',
      analysisResultData: {
        averageProductivity: 95,
        averageQualityScore: 92,
        proficiencyLevel: '3',
        errorRate: 8,
        recommendedAction: '現配置維持',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-001',
    };

    const result = await verifyAndScoreAnalysisResult(input);

    // 妥当性スコアが70以上であることを検証
    expect(result.validityScore).toBeGreaterThanOrEqual(70);
    expect(result.validityScore).toBe(100);
    
    // 承認推奨判定がAPPROVEDであることを検証
    expect(result.approvalRecommendation).toBe('APPROVED');
    
    // 判定理由が具体的な内容を含むことを検証
    expect(result.validityJudgmentReason).toBeTruthy();
    expect(result.validityJudgmentReason).toContain('過去実績との乖離');
    expect(result.validityJudgmentReason).toContain('業界標準');
    expect(result.validityJudgmentReason).toContain('承認推奨');
    
    // 業務ルール照合結果が配列で返されることを検証
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThan(0);
    result.businessRuleComplianceDetails.forEach((detail) => {
      expect(detail.ruleId).toBeTruthy();
      expect(detail.ruleName).toBeTruthy();
      expect(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).toContain(detail.complianceStatus);
      expect(detail.scoreContribution).toBeDefined();
      expect(typeof detail.scoreContribution).toBe('number');
      expect(detail.details).toBeTruthy();
    });
    
    // 過去実績との比較結果が返されることを検証
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.workerHistoricalAverage).toBe('number');
    expect(['IMPROVING', 'STABLE', 'DECLINING']).toContain(result.historicalPerformanceComparison.workerProductivityTrend);
    expect(typeof result.historicalPerformanceComparison.teamHistoricalAverage).toBe('number');
    expect(typeof result.historicalPerformanceComparison.siteHistoricalAverage).toBe('number');
    expect(typeof result.historicalPerformanceComparison.workerVsTeamDifference).toBe('number');
    expect(typeof result.historicalPerformanceComparison.workerVsSiteDifference).toBe('number');
    
    // 業界標準との比較結果が返されることを検証
    expect(result.industryStandardComparison).toBeDefined();
    expect(typeof result.industryStandardComparison.industryStandardProductivity).toBe('number');
    expect(typeof result.industryStandardComparison.industryStandardQuality).toBe('number');
    expect(typeof result.industryStandardComparison.productivityVsStandard).toBe('number');
    expect(typeof result.industryStandardComparison.qualityVsStandard).toBe('number');
    expect(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE']).toContain(result.industryStandardComparison.evaluationLevel);
    
    // スコア70以上のため要確認フラグがないことを検証
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview).toEqual([]);
    
    // 検証タイムスタンプがISO 8601形式で返されることを検証
    expect(result.verificationTimestamp).toBeTruthy();
    expect(new Date(result.verificationTimestamp)).toBeInstanceOf(Date);
  });

  it('妥当性スコアが70未満のときapprovalRecommendationがREQUIRES_REVIEWになることを検証する', async () => {
    const input = {
      analysisResultId: 'AR-002',
      workerId: 'W-002',
      teamId: 'T-002',
      siteId: 'S-002',
      analysisResultData: {
        averageProductivity: 70,
        averageQualityScore: 55,
        proficiencyLevel: '1',
        errorRate: 25,
        recommendedAction: '支援強化',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-001',
    };

    const result = await verifyAndScoreAnalysisResult(input);

    // 妥当性スコアが70未満であることを検証
    expect(result.validityScore).toBeLessThan(70);
    
    // 承認推奨判定がREQUIRES_REVIEWであることを検証
    expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');
    
    // 判定理由が返されることを検証
    expect(result.validityJudgmentReason).toBeTruthy();
    
    // 業務ルール照合結果が配列で返されることを検証
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    result.businessRuleComplianceDetails.forEach((detail) => {
      expect(detail.ruleId).toBeTruthy();
      expect(detail.ruleName).toBeTruthy();
      expect(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).toContain(detail.complianceStatus);
      expect(detail.scoreContribution).toBeDefined();
      expect(typeof detail.scoreContribution).toBe('number');
      expect(detail.details).toBeTruthy();
    });
    
    // 過去実績との比較結果が返されることを検証
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.workerHistoricalAverage).toBe('number');
    expect(['IMPROVING', 'STABLE', 'DECLINING']).toContain(result.historicalPerformanceComparison.workerProductivityTrend);
    expect(typeof result.historicalPerformanceComparison.teamHistoricalAverage).toBe('number');
    expect(typeof result.historicalPerformanceComparison.siteHistoricalAverage).toBe('number');
    expect(typeof result.historicalPerformanceComparison.workerVsTeamDifference).toBe('number');
    expect(typeof result.historicalPerformanceComparison.workerVsSiteDifference).toBe('number');
    
    // 業界標準との比較結果が返されることを検証
    expect(result.industryStandardComparison).toBeDefined();
    expect(typeof result.industryStandardComparison.industryStandardProductivity).toBe('number');
    expect(typeof result.industryStandardComparison.industryStandardQuality).toBe('number');
    expect(typeof result.industryStandardComparison.productivityVsStandard).toBe('number');
    expect(typeof result.industryStandardComparison.qualityVsStandard).toBe('number');
    expect(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE']).toContain(result.industryStandardComparison.evaluationLevel);
    
    // スコア70未満のため要確認フラグが存在することを検証
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview.length).toBeGreaterThan(0);
    result.flagsForReview.forEach((flag) => {
      expect(flag.flagType).toBeTruthy();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(flag.severity);
      expect(flag.description).toBeTruthy();
      expect(flag.recommendedReviewAction).toBeTruthy();
    });
    
    // 検証タイムスタンプがISO 8601形式で返されることを検証
    expect(result.verificationTimestamp).toBeTruthy();
    expect(new Date(result.verificationTimestamp)).toBeInstanceOf(Date);
  });
});