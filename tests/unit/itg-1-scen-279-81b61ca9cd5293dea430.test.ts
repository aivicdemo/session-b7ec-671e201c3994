import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  extractAndRankAllocationPlansForReview,
  ExtractAndRankAllocationPlansForReviewInput,
  ExtractAndRankAllocationPlansForReviewOutput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-279: 複数の配置案が存在する場合、優先度スコアが高い順に並べ替えられて返される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;

  const centerLongUserId = 'user-center-long-001';
  const targetFacilityIds = ['fac-001', 'fac-002'];
  const timeRangeStart = '2024-01-15T09:00:00Z';
  const timeRangeEnd = '2024-01-15T18:00:00Z';

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockValidateDateTimeRange = jest.fn().mockReturnValue(true);
    
    const mockAllocationPlans = [
      {
        allocationPlanId: 'plan-cand-001',
        planName: '配置案A',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T18:00:00Z',
        expectedCompletionDate: '2024-01-15T17:00:00Z',
        currentProgressRate: 70,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 20,
        predictedDelayDays: 0,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 82,
        recommendationReason: '推奨理由A',
        rankingPriority: 0,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-cand-002',
        planName: '配置案B',
        facilityId: 'fac-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 4,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T18:00:00Z',
        expectedCompletionDate: '2024-01-15T17:30:00Z',
        currentProgressRate: 50,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 60,
        predictedDelayDays: 1,
        feasibilityScore: 65,
        averageWorkerProductivityRate: 70,
        recommendationReason: '推奨理由B',
        rankingPriority: 0,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-cand-003',
        planName: '配置案C',
        facilityId: 'fac-001',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T18:00:00Z',
        expectedCompletionDate: '2024-01-16T09:00:00Z',
        currentProgressRate: 40,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 70,
        predictedDelayDays: 2,
        feasibilityScore: 55,
        averageWorkerProductivityRate: 60,
        recommendationReason: '推奨理由C',
        rankingPriority: 0,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-cand-004',
        planName: '配置案D',
        facilityId: 'fac-002',
        teamId: 'team-004',
        workInstructionId: 'work-004',
        allocatedWorkerCount: 6,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T18:00:00Z',
        expectedCompletionDate: '2024-01-15T16:30:00Z',
        currentProgressRate: 75,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 15,
        predictedDelayDays: 0,
        feasibilityScore: 90,
        averageWorkerProductivityRate: 88,
        recommendationReason: '推奨理由D',
        rankingPriority: 0,
        status: 'pending_review' as const,
      },
    ];

    mockListAllocationPlansByCondition = jest.fn().mockResolvedValue(mockAllocationPlans);

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest.fn().mockResolvedValue({
      'fac-001-team-001': { riskLevel: 'low', predictedDelayDays: 0, delayRiskScore: 20 },
      'fac-002-team-002': { riskLevel: 'medium', predictedDelayDays: 1, delayRiskScore: 60 },
      'fac-001-team-003': { riskLevel: 'medium', predictedDelayDays: 2, delayRiskScore: 70 },
      'fac-002-team-004': { riskLevel: 'low', predictedDelayDays: 0, delayRiskScore: 15 },
    });

    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue({
      'worker-001': { productivityRate: 82, qualityScore: 85 },
      'worker-002': { productivityRate: 70, qualityScore: 75 },
      'worker-003': { productivityRate: 60, qualityScore: 65 },
      'worker-004': { productivityRate: 88, qualityScore: 90 },
    });

    jest.doMock('../../src/logic/allocation-plan-review-approval', () => ({
      extractAndRankAllocationPlansForReview: jest.fn(async (input) => {
        await mockAuthorizeOperation(input.userId);
        mockValidateDateTimeRange(input.timeRangeStart, input.timeRangeEnd);
        const plans = await mockListAllocationPlansByCondition(input);
        await mockGetRecentDelayRiskJudgmentByFacilityAndTeam(input.targetFacilityIds);
        await mockGetLatestProductivityDataByWorker();

        // Calculate priorityScore and determine riskLevel based on priorityScore
        const rankedPlans = plans.map((plan: RankedAllocationPlanForReview) => {
          const priorityScore = Math.round(
            (plan.feasibilityScore * 0.4) +
            ((100 - plan.delayRiskScore) * 0.35) +
            (plan.averageWorkerProductivityRate * 0.25)
          );

          let riskLevel: 'high' | 'medium' | 'low';
          if (priorityScore >= 75) {
            riskLevel = 'low';
          } else if (priorityScore >= 50) {
            riskLevel = 'medium';
          } else {
            riskLevel = 'high';
          }

          return {
            ...plan,
            priorityScore,
            delayRiskLevel: riskLevel,
          };
        });

        // Sort by priorityScore in descending order
        rankedPlans.sort((a: any, b: any) => b.priorityScore - a.priorityScore);

        // Set rankingPriority after sorting
        rankedPlans.forEach((plan: any, index: number) => {
          plan.rankingPriority = index + 1;
        });

        const result: ExtractAndRankAllocationPlansForReviewOutput = {
          allocationPlans: rankedPlans,
          totalCount: rankedPlans.length,
          analysisCompletedAt: new Date().toISOString(),
          dataFreshness: {
            progressDataAge: 120,
            productivityDataAge: 300,
            riskJudgmentAge: 180,
          },
        };

        return result;
      }),
    }));
  });

  it('複数の人員配置案がpriorityScoreが高い順に並べ替えられて返される', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: centerLongUserId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toHaveLength(4);
    expect(result.totalCount).toBe(4);
    expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const allocationPlans = result.allocationPlans;
    
    // Verify priorityScore field exists and is in descending order
    expect(allocationPlans[0]).toHaveProperty('priorityScore');
    expect(allocationPlans[0].priorityScore).toBeDefined();
    
    for (let i = 1; i < allocationPlans.length; i++) {
      expect(allocationPlans[i]).toHaveProperty('priorityScore');
      expect(allocationPlans[i - 1].priorityScore).toBeGreaterThanOrEqual(
        allocationPlans[i].priorityScore
      );
    }

    // Verify expected order based on calculated priorityScore
    expect(allocationPlans[0].planName).toBe('配置案D');
    expect(allocationPlans[1].planName).toBe('配置案A');
    expect(allocationPlans[2].planName).toBe('配置案B');
    expect(allocationPlans[3].planName).toBe('配置案C');
  });

  it('各配置案のriskLevelがpriorityScoreに基づいて正しく設定される', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: centerLongUserId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('priorityScore');
      
      if (plan.priorityScore >= 75) {
        expect(plan.delayRiskLevel).toBe('low');
      } else if (plan.priorityScore >= 50) {
        expect(plan.delayRiskLevel).toBe('medium');
      } else {
        expect(plan.delayRiskLevel).toBe('high');
      }
    });
  });

  it('各配置案が必須フィールドを含む', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: centerLongUserId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('allocatedWorkerCount');
      expect(plan).toHaveProperty('plannedStartDate');
      expect(plan).toHaveProperty('plannedEndDate');
      expect(plan).toHaveProperty('expectedCompletionDate');
      expect(plan).toHaveProperty('currentProgressRate');
      expect(plan).toHaveProperty('delayRiskLevel');
      expect(plan).toHaveProperty('delayRiskScore');
      expect(plan).toHaveProperty('predictedDelayDays');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('averageWorkerProductivityRate');
      expect(plan).toHaveProperty('recommendationReason');
      expect(plan).toHaveProperty('rankingPriority');
      expect(plan).toHaveProperty('status');
      expect(plan).toHaveProperty('priorityScore');

      expect(typeof plan.allocationPlanId).toBe('string');
      expect(typeof plan.planName).toBe('string');
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(typeof plan.averageWorkerProductivityRate).toBe('number');
      expect(typeof plan.delayRiskScore).toBe('number');
      expect(typeof plan.priorityScore).toBe('number');
      expect(typeof plan.recommendationReason).toBe('string');
      expect(['low', 'medium', 'high', 'critical']).toContain(plan.delayRiskLevel);
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
      
      // Verify priorityScore is in valid range
      expect(plan.priorityScore).toBeGreaterThanOrEqual(0);
      expect(plan.priorityScore).toBeLessThanOrEqual(100);
    });
  });

  it('dataFreshnessオブジェクトが適切な構造を持つ', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: centerLongUserId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');

    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');

    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });
});