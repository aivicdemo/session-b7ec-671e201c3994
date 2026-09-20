import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-289: 作業者の作業負荷が均等に分散される配置案が加点される', () => {
  it('should rank allocation plans higher when workload is evenly distributed across workers', async () => {
    // テスト準備: 入力パラメータの構成
    const userId = 'center-manager-001';
    const targetFacilityIds = ['FAC-001', 'FAC-002'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T12:00:00Z';
    const priorityFilter = 'all';

    const input = {
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount: 50,
    };

    // テスト実行: extractAndRankAllocationPlansForReviewを呼び出す
    const result = await extractAndRankAllocationPlansForReview(input);

    // 期待結果の検証: 基本的な出力構造
    expect(result).toBeDefined();
    expect(result.totalCount).toBe(4);
    expect(result.allocationPlans).toHaveLength(4);

    // allocationPlans[0]は候補Aであることを確認
    const candidateA = result.allocationPlans[0];
    expect(candidateA.allocationPlanId).toBe('cand-A');
    expect(candidateA.facilityId).toBe('FAC-001');
    expect(candidateA.allocatedWorkerCount).toBe(3);
    expect(candidateA.delayRiskLevel).toBe('low');
    expect(candidateA.rankingPriority).toBe(1);
    expect(candidateA.feasibilityScore).toBeCloseTo(81.0, 1);
    expect(candidateA.currentProgressRate).toBeGreaterThanOrEqual(0);
    expect(candidateA.currentProgressRate).toBeLessThanOrEqual(100);
    expect(candidateA.plannedStartDate).toBeDefined();
    expect(candidateA.plannedEndDate).toBeDefined();
    expect(candidateA.expectedCompletionDate).toBeDefined();
    expect(candidateA.delayRiskScore).toBeDefined();
    expect(candidateA.delayRiskScore).toBeGreaterThanOrEqual(0);
    expect(candidateA.delayRiskScore).toBeLessThanOrEqual(100);
    expect(candidateA.predictedDelayDays).toBeDefined();
    expect(candidateA.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
    expect(candidateA.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
    expect(candidateA.recommendationReason).toMatch(/作業負荷が3名に均等に分散/);
    expect(candidateA.recommendationReason).toMatch(/生産性スコア.*85.*80.*75/);
    expect(candidateA.recommendationReason).toMatch(/効率的な完了/);
    expect(candidateA.status).toBe('pending_review');
    expect(candidateA.planName).toBeDefined();
    expect(candidateA.teamId).toBeDefined();
    expect(candidateA.workInstructionId).toBeDefined();

    // allocationPlans[1]は候補Cであることを確認
    const candidateC = result.allocationPlans[1];
    expect(candidateC.allocationPlanId).toBe('cand-C');
    expect(candidateC.rankingPriority).toBe(2);
    expect(candidateC.feasibilityScore).toBeCloseTo(79.0, 1);
    expect(candidateC.delayRiskLevel).toBe('low');
    expect(candidateC.allocatedWorkerCount).toBe(4);
    expect(candidateC.facilityId).toBe('FAC-002');

    // allocationPlans[2]は候補Dであることを確認
    const candidateD = result.allocationPlans[2];
    expect(candidateD.allocationPlanId).toBe('cand-D');
    expect(candidateD.rankingPriority).toBe(3);
    expect(candidateD.feasibilityScore).toBeCloseTo(76.0, 1);
    expect(candidateD.delayRiskLevel).toBe('medium');
    expect(candidateD.allocatedWorkerCount).toBe(2);
    expect(candidateD.facilityId).toBe('FAC-002');

    // allocationPlans[3]は候補Bであることを確認
    const candidateB = result.allocationPlans[3];
    expect(candidateB.allocationPlanId).toBe('cand-B');
    expect(candidateB.rankingPriority).toBe(4);
    expect(candidateB.feasibilityScore).toBeCloseTo(74.0, 1);
    expect(candidateB.delayRiskLevel).toBe('medium');
    expect(candidateB.allocatedWorkerCount).toBe(2);
    expect(candidateB.facilityId).toBe('FAC-001');

    // 優先度スコアの比較検証: 候補Aが候補Cより高い（作業負荷均等分散の加点効果）
    expect(candidateA.feasibilityScore).toBeGreaterThan(candidateC.feasibilityScore);

    // 優先度スコアの比較検証: 候補Cが候補Dより高い
    expect(candidateC.feasibilityScore).toBeGreaterThan(candidateD.feasibilityScore);

    // 優先度スコアの比較検証: 候補Dが候補Bより高い
    expect(candidateD.feasibilityScore).toBeGreaterThan(candidateB.feasibilityScore);

    // 作業負荷均等分散ルールが実装されていることを検証
    // 候補Aは3人に均等分散（各33%）、候補Dは2人に不均等配置（40%/60%）より優先度が高い
    expect(candidateA.feasibilityScore).toBeGreaterThan(candidateD.feasibilityScore);

    // 推奨理由が作業負荷均等分散と生産性スコアに言及していることを確認
    expect(candidateA.recommendationReason).toMatch(/均等/);
    expect(candidateA.recommendationReason).toMatch(/分散/);
    expect(candidateA.recommendationReason).toMatch(/生産性/);

    // analysisCompletedAtがISO 8601形式であることを確認
    expect(result.analysisCompletedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/
    );

    // dataFreshnessの各値が0～3600秒の範囲内の整数であることを確認
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.progressDataAge).toBeLessThanOrEqual(3600);
    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);
    
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeLessThanOrEqual(3600);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(true);
    
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeLessThanOrEqual(3600);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);

    // エラーが返されないことを確認
    expect(result.allocationPlans.every((plan) => plan.status !== 'rejected')).toBe(
      true
    );

    // 全ての配置案が必要なフィールドを持つことを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkerCount).toBeGreaterThan(0);
      expect(plan.plannedStartDate).toBeDefined();
      expect(plan.plannedEndDate).toBeDefined();
      expect(plan.expectedCompletionDate).toBeDefined();
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);
      expect(plan.predictedDelayDays).toBeDefined();
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
      expect(plan.recommendationReason).toBeDefined();
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
    });
  });
});