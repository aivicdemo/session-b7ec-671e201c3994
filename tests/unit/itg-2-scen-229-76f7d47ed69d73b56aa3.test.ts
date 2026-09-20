import { verifyAndScoreAnalysisResult } from '../../src/logic/analysis-result-verification';

describe('SCEN-229: 複数作業者に対する妥当性検証結果の分離', () => {
  it('複数の作業者に対して妥当性検証を実行するとき各作業者の結果が正しく分離される', async () => {
    // 作業者A（WORKER-001）の入力パラメータ
    const inputWorkerA = {
      analysisResultId: 'RESULT-001',
      workerId: 'WORKER-001',
      teamId: 'TEAM-A',
      siteId: 'SITE-001',
      analysisResultData: {
        averageProductivity: 95.0,
        averageQualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE',
        errorRate: 5,
        recommendedAction: 'MAINTAIN',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'EXEC-001',
    };

    // 作業者B（WORKER-002）の入力パラメータ
    const inputWorkerB = {
      analysisResultId: 'RESULT-002',
      workerId: 'WORKER-002',
      teamId: 'TEAM-B',
      siteId: 'SITE-001',
      analysisResultData: {
        averageProductivity: 72.5,
        averageQualityScore: 75,
        proficiencyLevel: 'JUNIOR',
        errorRate: 12,
        recommendedAction: 'UPSKILL',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      comparisonPeriodMonths: 3,
      executorUserId: 'EXEC-001',
    };

    // 作業者Aの検証を実行
    const resultWorkerA = await verifyAndScoreAnalysisResult(inputWorkerA);

    // 作業者Bの検証を実行
    const resultWorkerB = await verifyAndScoreAnalysisResult(inputWorkerB);

    // 作業者Aの結果を検証
    expect(resultWorkerA.validityScore).toBe(100);
    expect(resultWorkerA.approvalRecommendation).toBe('APPROVED');
    expect(resultWorkerA.validityJudgmentReason).toContain('過去実績との乖離度3.26%');
    expect(resultWorkerA.validityJudgmentReason).toContain('業界標準との乖離度-5%');
    expect(resultWorkerA.validityJudgmentReason).toContain('センター固有ルール準拠');
    expect(resultWorkerA.validityJudgmentReason).toContain('承認推奨');
    expect(resultWorkerA.businessRuleComplianceDetails).toHaveLength(3);
    expect(resultWorkerA.businessRuleComplianceDetails[0].scoreContribution).toBe(40);
    expect(resultWorkerA.businessRuleComplianceDetails[1].scoreContribution).toBe(35);
    expect(resultWorkerA.businessRuleComplianceDetails[2].scoreContribution).toBe(25);
    expect(resultWorkerA.flagsForReview).toEqual([]);
    expect(resultWorkerA.historicalPerformanceComparison.workerHistoricalAverage).toBe(92.0);
    expect(resultWorkerA.historicalPerformanceComparison.teamHistoricalAverage).toBe(90.0);
    expect(resultWorkerA.historicalPerformanceComparison.siteHistoricalAverage).toBe(85.0);
    expect(resultWorkerA.industryStandardComparison.productivityVsStandard).toBeCloseTo(-5, 1);

    // 作業者Bの結果を検証
    expect(resultWorkerB.validityScore).toBe(95);
    expect(resultWorkerB.approvalRecommendation).toBe('APPROVED');
    expect(resultWorkerB.validityJudgmentReason).toContain('過去実績との乖離度6.62%');
    expect(resultWorkerB.validityJudgmentReason).toContain('基準内');
    expect(resultWorkerB.validityJudgmentReason).toContain('業界標準との乖離度-27.5%');
    expect(resultWorkerB.validityJudgmentReason).toContain('±15%を超過');
    expect(resultWorkerB.validityJudgmentReason).toContain('確認要');
    expect(resultWorkerB.validityJudgmentReason).toContain('総合スコア95');
    expect(resultWorkerB.validityJudgmentReason).toContain('監視推奨');
    expect(resultWorkerB.businessRuleComplianceDetails).toHaveLength(3);
    expect(resultWorkerB.businessRuleComplianceDetails[0].scoreContribution).toBe(40);
    expect(resultWorkerB.businessRuleComplianceDetails[1].scoreContribution).toBe(35);
    expect(resultWorkerB.businessRuleComplianceDetails[2].scoreContribution).toBe(25);
    expect(resultWorkerB.flagsForReview.length).toBeGreaterThan(0);
    expect(resultWorkerB.flagsForReview[0].description).toContain('業界標準との乖離度-27.5%');
    expect(resultWorkerB.flagsForReview[0].description).toContain('許容範囲±15%を超過');
    expect(resultWorkerB.flagsForReview[0].recommendedReviewAction).toContain('業務習熟度向上研修');
    expect(resultWorkerB.flagsForReview[0].recommendedReviewAction).toContain('業界標準値の妥当性再確認');
    expect(resultWorkerB.historicalPerformanceComparison.workerHistoricalAverage).toBe(68.0);
    expect(resultWorkerB.historicalPerformanceComparison.teamHistoricalAverage).toBe(70.0);
    expect(resultWorkerB.historicalPerformanceComparison.siteHistoricalAverage).toBe(85.0);
    expect(resultWorkerB.industryStandardComparison.productivityVsStandard).toBeCloseTo(-27.5, 1);

    // 結果が完全に分離されていることを確認
    expect(resultWorkerA.validityScore).not.toBe(resultWorkerB.validityScore);
    expect(resultWorkerA.flagsForReview).not.toEqual(resultWorkerB.flagsForReview);
    expect(resultWorkerA.verificationTimestamp).not.toBe(resultWorkerB.verificationTimestamp);

    // workerId、teamId、siteId が正しく紐付いていることを確認
    // 出力型から確認可能な場合のチェック
    if ('workerId' in resultWorkerA) {
      expect((resultWorkerA as any).workerId).toBe('WORKER-001');
    }
    if ('workerId' in resultWorkerB) {
      expect((resultWorkerB as any).workerId).toBe('WORKER-002');
    }
    if ('teamId' in resultWorkerA) {
      expect((resultWorkerA as any).teamId).toBe('TEAM-A');
    }
    if ('teamId' in resultWorkerB) {
      expect((resultWorkerB as any).teamId).toBe('TEAM-B');
    }
    if ('siteId' in resultWorkerA) {
      expect((resultWorkerA as any).siteId).toBe('SITE-001');
    }
    if ('siteId' in resultWorkerB) {
      expect((resultWorkerB as any).siteId).toBe('SITE-001');
    }

    // タイムスタンプが有効な ISO 8601 形式であることを確認
    expect(new Date(resultWorkerA.verificationTimestamp).getTime()).toBeGreaterThan(0);
    expect(new Date(resultWorkerB.verificationTimestamp).getTime()).toBeGreaterThan(0);
  });
});