import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';
import { VerifyAndScoreAnalysisResultInput, AnalysisResultData } from '../../src/logic/analysis-result-verification';

describe('SCEN-222: 業界標準との乖離度が±15%を超えるとき低いスコア寄与度になり要確認フラグが立つ', () => {
  it('業界標準との乖離度が18.5%のとき、validityScoreが66、approvalRecommendationが REQUIRES_REVIEW となり、要確認フラグが生成される', async () => {
    // Arrange: 業界標準との乖離度が±15%を超える条件を設定（推奨生産性118.5 = 業界標準100の+18.5%）
    const analysisResultData: AnalysisResultData = {
      averageProductivity: 118.5,
      averageQualityScore: 85,
      proficiencyLevel: '中級',
      errorRate: 8,
      recommendedAction: 'スキルアップ推奨',
    };

    const input: VerifyAndScoreAnalysisResultInput = {
      analysisResultId: 'RES-TEST-001',
      workerId: 'WKR-001',
      teamId: 'TEAM-001',
      siteId: 'SITE-001',
      analysisResultData,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-03-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'USR-ADMIN-001',
    };

    // Act: verifyAndScoreAnalysisResult操作を呼び出す
    const result = await verifyAndScoreAnalysisResult(input);

    // Assert: validityScore が66を返す
    expect(result.validityScore).toBe(66);

    // Assert: approvalRecommendation が 'REQUIRES_REVIEW' を返す
    expect(result.approvalRecommendation).toBe('REQUIRES_REVIEW');

    // Assert: validityJudgmentReason に『業界標準との乖離度が±15%を超えるため、スコア寄与度が低下しています』を含む日本語説明を返す
    expect(result.validityJudgmentReason).toContain('業界標準との乖離度が±15%を超えるため');
    expect(result.validityJudgmentReason).toContain('スコア寄与度が低下');

    // Assert: flagsForReview 配列に要確認フラグが1件以上生成される
    expect(result.flagsForReview).toBeDefined();
    expect(result.flagsForReview?.length).toBeGreaterThanOrEqual(1);

    // Assert: 要確認フラグの内容に『業界標準比較：乖離度18.5%（±15%超過）』と『スコア寄与度：23.45（低い）』を含む
    const industryStandardFlag = result.flagsForReview?.find(flag =>
      flag.description.includes('業界標準') || flag.flagType.includes('INDUSTRY_STANDARD')
    );
    expect(industryStandardFlag).toBeDefined();
    if (industryStandardFlag) {
      expect(industryStandardFlag.description).toMatch(/乖離度.*18\.5%/);
      expect(industryStandardFlag.description).toMatch(/(?:23\.45|スコア寄与度)/);
    }

    // Assert: industryStandardComparison に乖離度18.5%を示す情報を含む
    expect(result.industryStandardComparison).toBeDefined();
    expect(result.industryStandardComparison.productivityVsStandard).toBeCloseTo(18.5, 1);

    // Assert: verificationTimestamp が ISO 8601形式の日時を返す
    expect(result.verificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});