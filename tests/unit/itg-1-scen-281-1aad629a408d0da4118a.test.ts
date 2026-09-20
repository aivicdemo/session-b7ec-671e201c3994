import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-281: maxResultCount が指定されていない場合、デフォルト値の50件が上限となる', () => {
  it('should return max 50 allocation plans when maxResultCount is not specified', async () => {
    const input = {
      userId: 'center-001',
      targetFacilityIds: ['FAC-A', 'FAC-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T17:00:00Z',
      priorityFilter: 'all',
    };

    const mockRankedPlans = Array.from({ length: 65 }, (_, i) => ({
      allocationPlanId: `plan-${i + 1}`,
      planName: `Allocation Plan ${i + 1}`,
      facilityId: i < 33 ? 'FAC-A' : 'FAC-B',
      teamId: `team-${Math.floor(i / 10) + 1}`,
      workInstructionId: `work-${i + 1}`,
      allocatedWorkerCount: 5 + (i % 3),
      plannedStartDate: '2024-01-15T09:00:00Z',
      plannedEndDate: '2024-01-15T17:00:00Z',
      expectedCompletionDate: '2024-01-15T16:00:00Z',
      currentProgressRate: 50 + (i % 30),
      delayRiskLevel: i % 4 === 0 ? 'critical' : i % 4 === 1 ? 'high' : i % 4 === 2 ? 'medium' : 'low',
      delayRiskScore: 30 + (i % 50),
      predictedDelayDays: i % 3,
      feasibilityScore: 60 + (i % 35),
      averageWorkerProductivityRate: 70 + (i % 25),
      recommendationReason: `Recommended because of score ${100 - i}`,
      rankingPriority: i + 1,
      status: 'pending_review',
    }));

    jest.spyOn(global as any, 'authorizeOperation').mockResolvedValue(undefined);
    jest.spyOn(global as any, 'validateDateTimeRange').mockResolvedValue(undefined);
    jest.spyOn(global as any, 'listAllocationPlansByCondition').mockResolvedValue(mockRankedPlans);
    jest.spyOn(global as any, 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue({});
    jest.spyOn(global as any, 'getLatestProductivityDataByWorker').mockResolvedValue({});
    jest.spyOn(global as any, 'recordOperationAudit').mockResolvedValue(undefined);

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeLessThanOrEqual(50);
    expect(result.allocationPlans.length).toEqual(50);
    
    expect(result.totalCount).toEqual(65);
    
    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.analysisCompletedAt)).toBe(true);
    
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
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
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.rankingPriority).toBeGreaterThan(0);
      expect(plan.status).toBe('pending_review');
    });

    const priorities = result.allocationPlans.map((p) => p.rankingPriority);
    const sortedPriorities = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sortedPriorities);
  });
});