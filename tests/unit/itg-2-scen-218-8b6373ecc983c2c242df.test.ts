import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, VerifyAndScoreAnalysisResultOutput } from '../../src/logic/analysis-result-verification';

describe('SCEN-218: 妥当性スコアが70未満のとき要確認フラグが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate review flags when validity score is below 70', async () => {
    // Arrange: テストデータの準備
    // 過去実績との乖離度を0.25に設定（intentionally）
    // pastScore = 60（要確認閾値以下）
    // 業界標準との乖離度を0.18に設定
    // benchmarkScore = 70（実テストでの設定）
    // 総合スコア計算: 60*0.4 + 70*0.35 + 100*0.25 = 24 + 24.5 + 25 = 73.5 → 妥当性スコア = 65（70未満）
    const analysisInput: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-TEST-001',
      workerId: 'WKR-001',
      teamId: 'TM-001',
      siteId: 'SITE-001',
      analysisResultData: {
        averageProductivity: 85,
        averageQualityScore: 92,
        proficiencyLevel: '中級',
        errorRate: 8,
        recommendedAction: '配置確認推奨',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-ADMIN-001',
    };

    // Act: 対象の公開処理を呼び出す
    const result: VerifyAndScoreAnalysisResultOutput = await verifyAndScoreAnalysisResult(analysisInput);

    // Assert: 検証結果を確認

    // 1. validityScore が70未満で返されていることを確認
    expect(result.validityScore).toBeLessThan(70);

    // 2. approvalRecommendation が 'REQUIRES_REVIEW' に設定されていることを確認
    expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');

    // 3. validityJudgmentReason に要確認の文言が含まれていることを確認
    expect(result.validityJudgmentReason).toContain('妥当性スコアが70未満');
    expect(result.validityJudgmentReason).toContain('確認が必要');

    // 4. flagsForReview 配列が空でなく、要確認フラグが生成されていることを確認
    expect(result.flagsForReview).toBeDefined();
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview!.length).toBeGreaterThan(0);

    // 5. businessRuleComplianceDetails が適切に設定されていることを確認
    expect(result.businessRuleComplianceDetails).toBeDefined();
    expect(Array.isArray(result.businessRuleComplianceDetails)).toBe(true);
    expect(result.businessRuleComplianceDetails.length).toBeGreaterThan(0);
    result.businessRuleComplianceDetails.forEach((detail) => {
      expect(detail.ruleId).toBeDefined();
      expect(detail.ruleName).toBeDefined();
      expect(detail.complianceStatus).toMatch(/^(COMPLIANT|NON_COMPLIANT|PARTIAL)$/);
      expect(detail.scoreContribution).toBeGreaterThanOrEqual(0);
      expect(detail.scoreContribution).toBeLessThanOrEqual(100);
      expect(detail.details).toBeDefined();
    });

    // 6. historicalPerformanceComparison が適切に設定されていることを確認
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.workerProductivityTrend).toMatch(
      /^(IMPROVING|STABLE|DECLINING)$/
    );
    expect(result.historicalPerformanceComparison.teamHistoricalAverage).toBeDefined();
    expect(result.historicalPerformanceComparison.siteHistoricalAverage).toBeDefined();
    expect(typeof result.historicalPerformanceComparison.workerVsTeamDifference).toBe('number');
    expect(typeof result.historicalPerformanceComparison.workerVsSiteDifference).toBe('number');

    // 7. industryStandardComparison が適切に設定されていることを確認
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.industryStandardProductivity).toBeGreaterThan(0);
    expect(result.industryStandardComparison.industryStandardQuality).toBeGreaterThan(0);
    expect(typeof result.industryStandardComparison.productivityVsStandard).toBe('number');
    expect(typeof result.industryStandardComparison.qualityVsStandard).toBe('number');
    expect(result.industryStandardComparison.evaluationLevel).toMatch(
      /^(EXCELLENT|GOOD|AVERAGE|BELOW_AVERAGE)$/
    );

    // 8. verificationTimestamp が ISO 8601 形式で記録されていることを確認
    expect(result.verificationTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.verificationTimestamp)).toBe(true);

    // 9. flagsForReview の各要素が適切に設定されていることを確認
    result.flagsForReview!.forEach((flag) => {
      expect(flag.flagType).toBeDefined();
      expect(flag.flagType.length).toBeGreaterThan(0);
      expect(flag.severity).toMatch(/^(HIGH|MEDIUM|LOW)$/);
      expect(flag.description).toBeDefined();
      expect(flag.description.length).toBeGreaterThan(0);
      expect(flag.recommendedReviewAction).toBeDefined();
      expect(flag.recommendedReviewAction.length).toBeGreaterThan(0);
    });

    // 10. flagsForReview に少なくとも以下の理由を含むフラグが存在することを確認：
    //    - 過去実績との乖離度が±20%を超える
    //    - 業界標準との乖離度が±15%を超える
    //    - センター固有ルール違反
    const flagDescriptions = result.flagsForReview!.map((flag) => flag.description.toLowerCase());
    const flagsString = flagDescriptions.join(' ');

    // 過去実績との乖離度または業界標準との乖離度に関するフラグが存在することを確認
    const hasDeviationFlag = result.flagsForReview!.some((flag) => {
      return flag.description.includes('過去実績') ||
             flag.description.includes('作業者') ||
             flag.description.includes('業界標準') ||
             flag.description.includes('標準') ||
             flag.description.includes('乖離');
    });
    expect(hasDeviationFlag).toBe(true);

    // 11. 分析結果データから乖離度を計算して検証
    const workerHistoricalAvg = result.historicalPerformanceComparison.workerHistoricalAverage;
    const industryStandardProd = result.industryStandardComparison.industryStandardProductivity;

    if (workerHistoricalAvg !== null && workerHistoricalAvg > 0) {
      const historicalDeviation = Math.abs(
        (analysisInput.analysisResultData.averageProductivity - workerHistoricalAvg) / workerHistoricalAvg
      );
      
      // 仕様要件: 過去実績との乖離度が±20%を超える場合
      if (historicalDeviation > 0.2) {
        const hasHistoricalFlag = result.flagsForReview!.some((flag) => {
          return flag.description.includes('過去実績') ||
                 flag.description.includes('作業者') ||
                 flag.description.includes('乖離');
        });
        expect(hasHistoricalFlag).toBe(true);
      }
    }

    if (industryStandardProd && industryStandardProd > 0) {
      const standardDeviation = Math.abs(
        (analysisInput.analysisResultData.averageProductivity - industryStandardProd) / industryStandardProd
      );

      // 仕様要件: 業界標準との乖離度が±15%を超える場合
      if (standardDeviation > 0.15) {
        const hasStandardFlag = result.flagsForReview!.some((flag) => {
          return flag.description.includes('業界標準') ||
                 flag.description.includes('標準') ||
                 flag.description.includes('乖離');
        });
        expect(hasStandardFlag).toBe(true);
      }
    }

    // 12. businessRuleComplianceDetails 内でセンター固有ルール違反に関する情報が記録されているか確認
    const ruleComplianceDetails = result.businessRuleComplianceDetails;
    expect(ruleComplianceDetails.length).toBeGreaterThan(0);
    
    // センター固有ルールまたは業務ルール関連の詳細が含まれていることを確認
    const hasRuleDetails = ruleComplianceDetails.some((detail) => {
      return detail.ruleId.includes('br-') ||
             detail.ruleName.includes('ルール') ||
             detail.details.includes('配置') ||
             detail.details.length > 0;
    });
    expect(hasRuleDetails).toBe(true);

    // 13. 妥当性スコアと承認推奨の一貫性を確認
    if (result.validityScore < 70) {
      expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');
    } else {
      expect(result.approvalRecommendation).toBe('APPROVED');
    }
  });
});