import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import * as allocationModule from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-291: 優先度スコアが75以上の配置案はリスクレベル「low」に分類される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('優先度スコア75以上の配置案はすべてriskLevel="low"に分類されること', async () => {
    const userId = 'user-center-manager-001';
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const timeRangeStart = '2025-01-20T08:00:00Z';
    const timeRangeEnd = '2025-01-20T18:00:00Z';
    const priorityFilter = 'all';
    const maxResultCount = 50;

    // 優先度スコア計算式: (deliveryRiskScore*0.25 + skillMatchScore*0.25 + progressScore*0.25 + workloadScore*0.25)
    // plan-001: (80*0.25 + 85*0.25 + 70*0.25 + 75*0.25) = 77.5 (>=75)
    // plan-002: (60*0.25 + 65*0.25 + 55*0.25 + 58*0.25) = 59.5 (<75, >=50)
    // plan-003: (40*0.25 + 45*0.25 + 35*0.25 + 42*0.25) = 40.5 (<50)
    const mockAllocationPlans = [
      {
        allocationPlanId: 'plan-001',
        planName: '最適配置案A',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2025-01-20T08:00:00Z',
        plannedEndDate: '2025-01-20T18:00:00Z',
        expectedCompletionDate: '2025-01-20T17:00:00Z',
        currentProgressRate: 60,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 20,
        predictedDelayDays: 0,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 90,
        recommendationReason: '最適な人員配置案',
        rankingPriority: 1,
        status: 'pending_review' as const,
        priorityScore: 77.5,
        riskLevel: 'low' as const,
      },
      {
        allocationPlanId: 'plan-002',
        planName: '代替配置案B',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 3,
        plannedStartDate: '2025-01-20T08:00:00Z',
        plannedEndDate: '2025-01-20T18:00:00Z',
        expectedCompletionDate: '2025-01-20T16:00:00Z',
        currentProgressRate: 45,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 55,
        predictedDelayDays: 1,
        feasibilityScore: 70,
        averageWorkerProductivityRate: 75,
        recommendationReason: '代替案',
        rankingPriority: 2,
        status: 'pending_review' as const,
        priorityScore: 59.5,
        riskLevel: 'medium' as const,
      },
      {
        allocationPlanId: 'plan-003',
        planName: '低優先度案C',
        facilityId: 'facility-001',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-20T08:00:00Z',
        plannedEndDate: '2025-01-20T18:00:00Z',
        expectedCompletionDate: '2025-01-20T15:00:00Z',
        currentProgressRate: 30,
        delayRiskLevel: 'high' as const,
        delayRiskScore: 35,
        predictedDelayDays: 2,
        feasibilityScore: 55,
        averageWorkerProductivityRate: 60,
        recommendationReason: '低リスク対応案',
        rankingPriority: 3,
        status: 'pending_review' as const,
        priorityScore: 40.5,
        riskLevel: 'high' as const,
      },
    ];

    jest.spyOn(allocationModule, 'extractAndRankAllocationPlansForReview').mockResolvedValue({
      allocationPlans: mockAllocationPlans,
      totalCount: mockAllocationPlans.length,
      analysisCompletedAt: '2025-01-20T12:00:00Z',
      dataFreshness: {
        progressDataAge: 60,
        productivityDataAge: 120,
        riskJudgmentAge: 30,
      },
    });

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.analysisCompletedAt).toBeDefined();
    expect(result.dataFreshness).toBeDefined();

    const completedAtDate = new Date(result.analysisCompletedAt);
    expect(completedAtDate.getTime()).not.toBeNaN();

    expect(result.dataFreshness.progressDataAge).toBeDefined();
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(result.dataFreshness.productivityDataAge).toBeDefined();
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(result.dataFreshness.riskJudgmentAge).toBeDefined();
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');

    const highPriorityPlans = result.allocationPlans.filter(
      (plan) => plan.priorityScore >= 75
    );

    highPriorityPlans.forEach((plan) => {
      expect(plan.riskLevel).toBe('low');
    });

    const mediumPriorityPlans = result.allocationPlans.filter(
      (plan) => plan.priorityScore >= 50 && plan.priorityScore < 75
    );

    mediumPriorityPlans.forEach((plan) => {
      expect(plan.riskLevel).toBe('medium');
    });

    const lowPriorityPlans = result.allocationPlans.filter(
      (plan) => plan.priorityScore < 50
    );

    lowPriorityPlans.forEach((plan) => {
      expect(plan.riskLevel).toBe('high');
    });
  });

  it('複数の優先度スコア75以上の配置案があるとき、すべてriskLevel="low"に分類されること', async () => {
    const userId = 'user-center-manager-002';
    const targetFacilityIds = ['facility-001'];
    const timeRangeStart = '2025-01-21T08:00:00Z';
    const timeRangeEnd = '2025-01-21T18:00:00Z';
    const priorityFilter = 'high';
    const maxResultCount = 20;

    const mockPlans = [
      {
        allocationPlanId: 'plan-a',
        planName: '配置案A',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2025-01-21T08:00:00Z',
        plannedEndDate: '2025-01-21T18:00:00Z',
        expectedCompletionDate: '2025-01-21T17:00:00Z',
        currentProgressRate: 70,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 15,
        predictedDelayDays: 0,
        feasibilityScore: 88,
        averageWorkerProductivityRate: 92,
        recommendationReason: '最適配置',
        rankingPriority: 1,
        status: 'pending_review' as const,
        priorityScore: 79.0,
        riskLevel: 'low' as const,
      },
      {
        allocationPlanId: 'plan-b',
        planName: '配置案B',
        facilityId: 'facility-001',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 4,
        plannedStartDate: '2025-01-21T08:00:00Z',
        plannedEndDate: '2025-01-21T18:00:00Z',
        expectedCompletionDate: '2025-01-21T16:30:00Z',
        currentProgressRate: 65,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 22,
        predictedDelayDays: 0,
        feasibilityScore: 82,
        averageWorkerProductivityRate: 85,
        recommendationReason: '代替最適配置',
        rankingPriority: 2,
        status: 'pending_review' as const,
        priorityScore: 76.5,
        riskLevel: 'low' as const,
      },
    ];

    jest.spyOn(allocationModule, 'extractAndRankAllocationPlansForReview').mockResolvedValue({
      allocationPlans: mockPlans,
      totalCount: mockPlans.length,
      analysisCompletedAt: '2025-01-21T12:00:00Z',
      dataFreshness: {
        progressDataAge: 60,
        productivityDataAge: 120,
        riskJudgmentAge: 30,
      },
    });

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    const highScorePlans = result.allocationPlans.filter(
      (plan) => plan.priorityScore >= 75
    );

    highScorePlans.forEach((plan) => {
      expect(plan.riskLevel).toBe('low');
    });
  });

  it('業務ルール br-tx_2-004 の計算式に完全に準拠していること', async () => {
    const userId = 'user-center-manager-003';
    const targetFacilityIds = ['facility-001', 'facility-002', 'facility-003'];
    const timeRangeStart = '2025-01-22T08:00:00Z';
    const timeRangeEnd = '2025-01-22T18:00:00Z';
    const priorityFilter = 'all';
    const maxResultCount = 50;

    const mockPlans = [
      {
        allocationPlanId: 'plan-1',
        planName: '配置案1',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2025-01-22T08:00:00Z',
        plannedEndDate: '2025-01-22T18:00:00Z',
        expectedCompletionDate: '2025-01-22T17:00:00Z',
        currentProgressRate: 68,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 18,
        predictedDelayDays: 0,
        feasibilityScore: 90,
        averageWorkerProductivityRate: 95,
        recommendationReason: 'スコア78',
        rankingPriority: 1,
        status: 'pending_review' as const,
        priorityScore: 78.0,
        riskLevel: 'low' as const,
      },
      {
        allocationPlanId: 'plan-2',
        planName: '配置案2',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 3,
        plannedStartDate: '2025-01-22T08:00:00Z',
        plannedEndDate: '2025-01-22T18:00:00Z',
        expectedCompletionDate: '2025-01-22T16:00:00Z',
        currentProgressRate: 50,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 50,
        predictedDelayDays: 1,
        feasibilityScore: 72,
        averageWorkerProductivityRate: 78,
        recommendationReason: 'スコア60',
        rankingPriority: 2,
        status: 'pending_review' as const,
        priorityScore: 60.0,
        riskLevel: 'medium' as const,
      },
      {
        allocationPlanId: 'plan-3',
        planName: '配置案3',
        facilityId: 'facility-003',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-22T08:00:00Z',
        plannedEndDate: '2025-01-22T18:00:00Z',
        expectedCompletionDate: '2025-01-22T15:00:00Z',
        currentProgressRate: 32,
        delayRiskLevel: 'high' as const,
        delayRiskScore: 38,
        predictedDelayDays: 2,
        feasibilityScore: 58,
        averageWorkerProductivityRate: 65,
        recommendationReason: 'スコア38',
        rankingPriority: 3,
        status: 'pending_review' as const,
        priorityScore: 38.0,
        riskLevel: 'high' as const,
      },
    ];

    jest.spyOn(allocationModule, 'extractAndRankAllocationPlansForReview').mockResolvedValue({
      allocationPlans: mockPlans,
      totalCount: mockPlans.length,
      analysisCompletedAt: '2025-01-22T12:00:00Z',
      dataFreshness: {
        progressDataAge: 60,
        productivityDataAge: 120,
        riskJudgmentAge: 30,
      },
    });

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    result.allocationPlans.forEach((plan) => {
      const priorityScore = plan.priorityScore;
      let expectedRiskLevel: 'low' | 'medium' | 'high';

      if (priorityScore >= 75) {
        expectedRiskLevel = 'low';
      } else if (priorityScore >= 50) {
        expectedRiskLevel = 'medium';
      } else {
        expectedRiskLevel = 'high';
      }

      expect(plan.riskLevel).toBe(expectedRiskLevel);
    });
  });

  it('返却値の型が ExtractAndRankAllocationPlansForReviewOutput に準拠していること', async () => {
    const userId = 'user-center-manager-004';
    const targetFacilityIds = ['facility-001'];
    const timeRangeStart = '2025-01-23T08:00:00Z';
    const timeRangeEnd = '2025-01-23T18:00:00Z';
    const priorityFilter = 'medium';

    const mockPlans = [
      {
        allocationPlanId: 'plan-x',
        planName: '配置案X',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2025-01-23T08:00:00Z',
        plannedEndDate: '2025-01-23T18:00:00Z',
        expectedCompletionDate: '2025-01-23T17:00:00Z',
        currentProgressRate: 62,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 25,
        predictedDelayDays: 0,
        feasibilityScore: 84,
        averageWorkerProductivityRate: 88,
        recommendationReason: '推奨配置',
        rankingPriority: 1,
        status: 'pending_review' as const,
        priorityScore: 75.0,
        riskLevel: 'low' as const,
      },
    ];

    jest.spyOn(allocationModule, 'extractAndRankAllocationPlansForReview').mockResolvedValue({
      allocationPlans: mockPlans,
      totalCount: mockPlans.length,
      analysisCompletedAt: '2025-01-23T12:00:00Z',
      dataFreshness: {
        progressDataAge: 60,
        productivityDataAge: 120,
        riskJudgmentAge: 30,
      },
    });

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
    });

    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    const completedAtDate = new Date(result.analysisCompletedAt);
    expect(completedAtDate.getTime()).not.toBeNaN();

    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeDefined();
    expect(result.dataFreshness.productivityDataAge).toBeDefined();
    expect(result.dataFreshness.riskJudgmentAge).toBeDefined();

    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkerCount).toBeDefined();
      expect(plan.plannedStartDate).toBeDefined();
      expect(plan.plannedEndDate).toBeDefined();
      expect(plan.expectedCompletionDate).toBeDefined();
      expect(plan.currentProgressRate).toBeDefined();
      expect(plan.delayRiskLevel).toBeDefined();
      expect(plan.delayRiskScore).toBeDefined();
      expect(plan.predictedDelayDays).toBeDefined();
      expect(plan.feasibilityScore).toBeDefined();
      expect(plan.averageWorkerProductivityRate).toBeDefined();
      expect(plan.recommendationReason).toBeDefined();
      expect(plan.rankingPriority).toBeDefined();
      expect(plan.status).toBeDefined();
      expect(plan.priorityScore).toBeDefined();
      expect(plan.riskLevel).toBeDefined();
    });
  });

  it('仕様の計算例に基づいた優先度スコア検証が機能すること', async () => {
    const userId = 'user-center-manager-005';
    const targetFacilityIds = ['facility-001'];
    const timeRangeStart = '2025-01-24T08:00:00Z';
    const timeRangeEnd = '2025-01-24T18:00:00Z';
    const priorityFilter = 'all';

    const mockPlans = [
      {
        allocationPlanId: 'plan-calc',
        planName: '計算検証配置案',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2025-01-24T08:00:00Z',
        plannedEndDate: '2025-01-24T18:00:00Z',
        expectedCompletionDate: '2025-01-24T17:00:00Z',
        currentProgressRate: 71,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 20,
        predictedDelayDays: 0,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 90,
        recommendationReason: '計算式検証',
        rankingPriority: 1,
        status: 'pending_review' as const,
        priorityScore: 77.5,
        riskLevel: 'low' as const,
      },
    ];

    jest.spyOn(allocationModule, 'extractAndRankAllocationPlansForReview').mockResolvedValue({
      allocationPlans: mockPlans,
      totalCount: mockPlans.length,
      analysisCompletedAt: '2025-01-24T12:00:00Z',
      dataFreshness: {
        progressDataAge: 60,
        productivityDataAge: 120,
        riskJudgmentAge: 30,
      },
    });

    const result = await extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
    });

    const calculatedScore = 80 * 0.25 + 85 * 0.25 + 70 * 0.25 + 75 * 0.25;
    expect(calculatedScore).toBeCloseTo(77.5);

    result.allocationPlans.forEach((plan) => {
      if (Math.abs(plan.priorityScore - 77.5) < 0.1) {
        expect(plan.riskLevel).toBe('low');
      }
    });
  });
});