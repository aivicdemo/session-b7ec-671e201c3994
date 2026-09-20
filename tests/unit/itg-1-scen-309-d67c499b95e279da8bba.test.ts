import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-309: targetFacilityIds が1件のみ指定された場合', () => {
  it('その拠点の配置案のみが抽出される', async () => {
    // テスト入力値を準備
    const userId = 'center-001';
    const targetFacilityIds = ['facility-A'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T17:00:00Z';
    const priorityFilter = 'all';
    const maxResultCount = 50;

    const input = {
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    };

    // 関数を呼び出す
    const output = await extractAndRankAllocationPlansForReview(input);

    // 戻り値の型を検証
    expect(output).toBeDefined();
    expect(output.allocationPlans).toBeDefined();
    expect(Array.isArray(output.allocationPlans)).toBe(true);
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.analysisCompletedAt).toBeDefined();
    expect(typeof output.analysisCompletedAt).toBe('string');
    expect(output.dataFreshness).toBeDefined();
    expect(typeof output.dataFreshness.progressDataAge).toBe('number');
    expect(typeof output.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof output.dataFreshness.riskJudgmentAge).toBe('number');

    // allocationPlans 配列内のすべての配置案が targetFacilityIds で指定された 'facility-A' に属していることを確認
    output.allocationPlans.forEach((plan) => {
      expect(plan.facilityId).toBe('facility-A');
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.teamId).toBeDefined();
      expect(typeof plan.teamId).toBe('string');
      expect(plan.workInstructionId).toBeDefined();
      expect(typeof plan.workInstructionId).toBe('string');
      expect(plan.allocatedWorkerCount).toBeDefined();
      expect(typeof plan.allocatedWorkerCount).toBe('number');
      expect(plan.plannedStartDate).toBeDefined();
      expect(typeof plan.plannedStartDate).toBe('string');
      expect(plan.plannedEndDate).toBeDefined();
      expect(typeof plan.plannedEndDate).toBe('string');
      expect(plan.expectedCompletionDate).toBeDefined();
      expect(typeof plan.expectedCompletionDate).toBe('string');
      expect(plan.currentProgressRate).toBeDefined();
      expect(typeof plan.currentProgressRate).toBe('number');
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      expect(plan.delayRiskScore).toBeDefined();
      expect(typeof plan.delayRiskScore).toBe('number');
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);
      expect(plan.predictedDelayDays).toBeDefined();
      expect(typeof plan.predictedDelayDays).toBe('number');
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.averageWorkerProductivityRate).toBeDefined();
      expect(typeof plan.averageWorkerProductivityRate).toBe('number');
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.rankingPriority).toBeDefined();
      expect(typeof plan.rankingPriority).toBe('number');
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
    });

    // targetFacilityIds が1件のみであるため、他拠点の配置案が一切含まれないことを確認
    const uniqueFacilityIds = new Set(output.allocationPlans.map((plan) => plan.facilityId));
    expect(uniqueFacilityIds.size).toBeLessThanOrEqual(1);
    expect(Array.from(uniqueFacilityIds)).toEqual(['facility-A']);

    // analysisCompletedAt が有効なISO 8601形式であることを確認
    expect(() => new Date(output.analysisCompletedAt)).not.toThrow();
    expect(new Date(output.analysisCompletedAt).getTime()).not.toBeNaN();

    // dataFreshness の値が妥当であることを確認
    expect(output.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(output.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(output.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });
});