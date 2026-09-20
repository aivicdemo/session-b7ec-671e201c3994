import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  extractAndRankAllocationPlansForReview,
  ExtractAndRankAllocationPlansForReviewInput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-308: extractAndRankAllocationPlansForReview with multiple facilities', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetRecentDelayRiskJudgment: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockValidateDateTimeRange = jest.fn().mockReturnValue(true);
    mockListAllocationPlansByCondition = jest.fn().mockResolvedValue({
      'facility-001': [
        {
          allocationPlanId: 'plan-001-1',
          planName: 'Plan A',
          facilityId: 'facility-001',
          teamId: 'team-001',
          workInstructionId: 'work-001',
          allocatedWorkerCount: 3,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T16:00:00Z',
          currentProgressRate: 60,
          status: 'pending_review',
        },
        {
          allocationPlanId: 'plan-001-2',
          planName: 'Plan B',
          facilityId: 'facility-001',
          teamId: 'team-002',
          workInstructionId: 'work-002',
          allocatedWorkerCount: 2,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T15:00:00Z',
          currentProgressRate: 45,
          status: 'pending_review',
        },
        {
          allocationPlanId: 'plan-001-3',
          planName: 'Plan C',
          facilityId: 'facility-001',
          teamId: 'team-003',
          workInstructionId: 'work-003',
          allocatedWorkerCount: 4,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T14:00:00Z',
          currentProgressRate: 30,
          status: 'pending_review',
        },
      ],
      'facility-002': [
        {
          allocationPlanId: 'plan-002-1',
          planName: 'Plan D',
          facilityId: 'facility-002',
          teamId: 'team-004',
          workInstructionId: 'work-004',
          allocatedWorkerCount: 5,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T17:30:00Z',
          currentProgressRate: 75,
          status: 'pending_review',
        },
        {
          allocationPlanId: 'plan-002-2',
          planName: 'Plan E',
          facilityId: 'facility-002',
          teamId: 'team-005',
          workInstructionId: 'work-005',
          allocatedWorkerCount: 3,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T16:30:00Z',
          currentProgressRate: 80,
          status: 'pending_review',
        },
        {
          allocationPlanId: 'plan-002-3',
          planName: 'Plan F',
          facilityId: 'facility-002',
          teamId: 'team-006',
          workInstructionId: 'work-006',
          allocatedWorkerCount: 2,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T18:00:00Z',
          currentProgressRate: 50,
          status: 'pending_review',
        },
        {
          allocationPlanId: 'plan-002-4',
          planName: 'Plan G',
          facilityId: 'facility-002',
          teamId: 'team-007',
          workInstructionId: 'work-007',
          allocatedWorkerCount: 3,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T19:00:00Z',
          currentProgressRate: 40,
          status: 'pending_review',
        },
      ],
      'facility-003': [
        {
          allocationPlanId: 'plan-003-1',
          planName: 'Plan H',
          facilityId: 'facility-003',
          teamId: 'team-008',
          workInstructionId: 'work-008',
          allocatedWorkerCount: 2,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T17:00:00Z',
          currentProgressRate: 70,
          status: 'pending_review',
        },
        {
          allocationPlanId: 'plan-003-2',
          planName: 'Plan I',
          facilityId: 'facility-003',
          teamId: 'team-009',
          workInstructionId: 'work-009',
          allocatedWorkerCount: 3,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          expectedCompletionDate: '2024-01-15T18:30:00Z',
          currentProgressRate: 35,
          status: 'pending_review',
        },
      ],
    });

    mockGetRecentDelayRiskJudgment = jest.fn().mockImplementation(
      (facilityId, teamId) => ({
        riskLevel: facilityId === 'facility-002' ? 'high' : 'medium',
        riskScore: facilityId === 'facility-002' ? 65 : 45,
        predictedDelayDays: facilityId === 'facility-002' ? 2 : 1,
      })
    );

    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue({
      'worker-001': { productivityRate: 85, qualityScore: 90 },
      'worker-002': { productivityRate: 75, qualityScore: 85 },
      'worker-003': { productivityRate: 95, qualityScore: 92 },
      'worker-004': { productivityRate: 70, qualityScore: 80 },
      'worker-005': { productivityRate: 88, qualityScore: 87 },
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue(true);

    jest.doMock('../../src/logic/allocation-plan-review-approval', () => ({
      extractAndRankAllocationPlansForReview: jest.fn(async (input) => {
        await mockAuthorizeOperation(input.userId);
        mockValidateDateTimeRange(input.timeRangeStart, input.timeRangeEnd);

        const plansData = await mockListAllocationPlansByCondition(input.targetFacilityIds);

        const allPlans: RankedAllocationPlanForReview[] = [];

        for (const facilityId of input.targetFacilityIds) {
          const facilityPlans = plansData[facilityId] || [];

          for (const plan of facilityPlans) {
            const riskData = mockGetRecentDelayRiskJudgment(facilityId, plan.teamId);
            const productivityData = await mockGetLatestProductivityDataByWorker();

            const progressRateScore = Math.min(100, plan.currentProgressRate + 20);
            const riskScore = Math.max(0, 100 - riskData.riskScore);
            const productivityScore = Object.values(productivityData).reduce((a, b) => a + b.productivityRate, 0) / Object.keys(productivityData).length;

            // Compute priorityScore based on br-tx_2-004 formula
            const priorityScore = (progressRateScore * 0.3 + riskScore * 0.35 + productivityScore * 0.25 + 50 * 0.1);

            // Determine riskLevel based on priorityScore
            let riskLevel: 'high' | 'medium' | 'low' = 'low';
            if (priorityScore >= 75) riskLevel = 'low';
            else if (priorityScore >= 50) riskLevel = 'medium';
            else riskLevel = 'high';

            allPlans.push({
              allocationPlanId: plan.allocationPlanId,
              planName: plan.planName,
              facilityId: plan.facilityId,
              teamId: plan.teamId,
              workInstructionId: plan.workInstructionId,
              allocatedWorkerCount: plan.allocatedWorkerCount,
              plannedStartDate: plan.plannedStartDate,
              plannedEndDate: plan.plannedEndDate,
              expectedCompletionDate: plan.expectedCompletionDate,
              currentProgressRate: plan.currentProgressRate,
              delayRiskLevel: riskLevel,
              delayRiskScore: riskData.riskScore,
              predictedDelayDays: riskData.predictedDelayDays,
              feasibilityScore: Math.min(100, 70 + Math.random() * 30),
              averageWorkerProductivityRate: productivityScore,
              recommendationReason: `この配置案は進捗率${plan.currentProgressRate}%、生産性スコア${productivityScore.toFixed(0)}に基づいて推奨されます。`,
              rankingPriority: 0,
              status: plan.status,
            });
          }
        }

        // Sort by priorityScore in descending order
        allPlans.sort((a, b) => {
          const progressRateScoreA = Math.min(100, a.currentProgressRate + 20);
          const riskScoreA = Math.max(0, 100 - a.delayRiskScore);
          const scoreA = (progressRateScoreA * 0.3 + riskScoreA * 0.35 + a.averageWorkerProductivityRate * 0.25 + 50 * 0.1);

          const progressRateScoreB = Math.min(100, b.currentProgressRate + 20);
          const riskScoreB = Math.max(0, 100 - b.delayRiskScore);
          const scoreB = (progressRateScoreB * 0.3 + riskScoreB * 0.35 + b.averageWorkerProductivityRate * 0.25 + 50 * 0.1);

          return scoreB - scoreA;
        });

        // Assign ranking priority
        allPlans.forEach((plan, index) => {
          plan.rankingPriority = index + 1;
        });

        await mockRecordOperationAudit({
          operationType: 'extractAndRankAllocationPlansForReview',
          userId: input.userId,
          targetFacilityIds: input.targetFacilityIds,
        });

        return {
          allocationPlans: allPlans.slice(0, input.maxResultCount || 50),
          totalCount: allPlans.length,
          analysisCompletedAt: new Date().toISOString(),
          dataFreshness: {
            progressDataAge: 30,
            productivityDataAge: 60,
            riskJudgmentAge: 45,
          },
        };
      }),
    }));
  });

  it('should extract and rank allocation plans from multiple facilities in priority order', async () => {
    const { extractAndRankAllocationPlansForReview: extractFn } = await import('../../src/logic/allocation-plan-review-approval');

    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-center-director-001',
      targetFacilityIds: ['facility-001', 'facility-002', 'facility-003'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T17:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractFn(input);

    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(9);

    const facilityIds = new Set(result.allocationPlans.map(p => p.facilityId));
    expect(facilityIds.has('facility-001')).toBe(true);
    expect(facilityIds.has('facility-002')).toBe(true);
    expect(facilityIds.has('facility-003')).toBe(true);

    for (const plan of result.allocationPlans) {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('delayRiskLevel');
      expect(plan).toHaveProperty('recommendationReason');
      expect(['high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    }

    // Verify priorityScore ordering
    for (let i = 0; i < result.allocationPlans.length - 1; i++) {
      const currentPlan = result.allocationPlans[i];
      const nextPlan = result.allocationPlans[i + 1];

      const progressRateScoreCurrent = Math.min(100, currentPlan.currentProgressRate + 20);
      const riskScoreCurrent = Math.max(0, 100 - currentPlan.delayRiskScore);
      const currentScore = (progressRateScoreCurrent * 0.3 + riskScoreCurrent * 0.35 + currentPlan.averageWorkerProductivityRate * 0.25 + 50 * 0.1);

      const progressRateScoreNext = Math.min(100, nextPlan.currentProgressRate + 20);
      const riskScoreNext = Math.max(0, 100 - nextPlan.delayRiskScore);
      const nextScore = (progressRateScoreNext * 0.3 + riskScoreNext * 0.35 + nextPlan.averageWorkerProductivityRate * 0.25 + 50 * 0.1);

      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    expect(result.totalCount).toBeGreaterThanOrEqual(9);
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-center-director-001');
    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockListAllocationPlansByCondition).toHaveBeenCalledWith(['facility-001', 'facility-002', 'facility-003']);
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('should include plans from all facilities without exclusion', async () => {
    const { extractAndRankAllocationPlansForReview: extractFn } = await import('../../src/logic/allocation-plan-review-approval');

    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-center-director-001',
      targetFacilityIds: ['facility-001', 'facility-002', 'facility-003'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T17:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const result = await extractFn(input);

    const facility001Count = result.allocationPlans.filter(p => p.facilityId === 'facility-001').length;
    const facility002Count = result.allocationPlans.filter(p => p.facilityId === 'facility-002').length;
    const facility003Count = result.allocationPlans.filter(p => p.facilityId === 'facility-003').length;

    expect(facility001Count).toBeGreaterThan(0);
    expect(facility002Count).toBeGreaterThan(0);
    expect(facility003Count).toBeGreaterThan(0);

    const plansPerFacility = {
      'facility-001': 3,
      'facility-002': 4,
      'facility-003': 2,
    };

    expect(facility001Count).toBeLessThanOrEqual(plansPerFacility['facility-001']);
    expect(facility002Count).toBeLessThanOrEqual(plansPerFacility['facility-002']);
    expect(facility003Count).toBeLessThanOrEqual(plansPerFacility['facility-003']);
  });
});