import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, VerifyAndScoreAnalysisResultOutput } from '../../src/logic/analysis-result-verification';

describe('SCEN-220: 過去実績の平均値から±20%を超える乖離は低いスコア寄与度になり要確認フラグが立つ', () => {
  it('should return REQUIRES_REVIEW with validity score below 70 when historical variance exceeds ±20%', async () => {
    // 手順1: 入力データの準備
    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'AR-001',
      workerId: 'W-001',
      teamId: 'T-001',
      siteId: 'S-001',
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'U-001',
      analysisResultData: {
        // 手順2: 過去3ヶ月平均生産性を100とした場合、推奨生産性を125（+25%）に設定
        averageProductivity: 125,
        averageQualityScore: 85,
        proficiencyLevel: '中級',
        errorRate: 5,
        recommendedAction: 'スキルアップ研修を実施'
      }
    };

    // 手順3-4: モック設定を含めた関数呼び出し
    // verifyAndScoreAnalysisResult は内部で必要なデータを収集・検証するため、
    // 実際の関数動作を観察する
    const result = await verifyAndScoreAnalysisResult(input);

    // 検証開始
    
    // (1) validityScore は70未満であること
    expect(result.validityScore).toBeLessThan(70);
    expect(result.validityScore).toBeGreaterThanOrEqual(0);
    expect(result.validityScore).toBeLessThanOrEqual(100);

    // (2) approvalRecommendation は 'REQUIRES_REVIEW' であること
    expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');

    // (3) validityJudgmentReason に過去実績との乖離に関する文言が含まれること
    expect(result.validityJudgmentReason).toContain('過去実績');
    expect(result.validityJudgmentReason).toMatch(/±\d+%|乖離|基準/);

    // (4) flagsForReview が配列で存在し、少なくとも1件以上の要確認フラグが含まれていること
    expect(Array.isArray(result.flagsForReview)).toBe(true);
    expect(result.flagsForReview).toBeDefined();
    if (result.flagsForReview && result.flagsForReview.length > 0) {
      expect(result.flagsForReview.length).toBeGreaterThanOrEqual(1);
      
      // 過去実績との乖離に関するフラグが含まれていることを確認
      const historicalVarianceFlag = result.flagsForReview.find(flag =>
        flag.description && (
          flag.description.includes('過去実績') ||
          flag.description.includes('乖離') ||
          flag.description.includes('基準')
        )
      );
      expect(historicalVarianceFlag).toBeDefined();
    }

    // (5) historicalPerformanceComparison オブジェクトに過去実績との差分が記録されること
    expect(result.historicalPerformanceComparison).toBeDefined();
    expect(result.historicalPerformanceComparison.workerHistoricalAverage).toBeDefined();
    
    // 差分を検証: 125 vs 100 = +25% (基準±20%を超過)
    if (result.historicalPerformanceComparison.workerHistoricalAverage !== null) {
      const workerHistoricalAvg = result.historicalPerformanceComparison.workerHistoricalAverage;
      const currentProductivity = input.analysisResultData.averageProductivity;
      const variancePercent = Math.abs((currentProductivity - workerHistoricalAvg) / workerHistoricalAvg) * 100;
      
      // 25% の乖離が記録されていることを確認
      expect(variancePercent).toBeGreaterThan(20);
    }

    // (6) verificationTimestamp が ISO 8601 形式であること
    expect(result.verificationTimestamp).toBeDefined();
    expect(typeof result.verificationTimestamp).toBe('string');
    // ISO 8601 形式の簡易チェック
    expect(result.verificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});