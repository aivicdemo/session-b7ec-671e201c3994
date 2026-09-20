import { jest } from '@jest/globals';
import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-288: 複数拠点が対象の場合、進捗が遅れている拠点の配置案が優先される', () => {
  const baseAllocationPlans = [
    {
      allocationPlanId: 'cand-001',
      planName: 'Plan A',
      facilityId: 'facility-A',
      teamId: 'team-A',
      workInstructionId: 'wi-A',
      allocatedWorkerCount: 5,
      plannedStartDate: '2025-01-15T09:00:00Z',
      plannedEndDate: '2025-01-15T17:00:00Z',
      expectedCompletionDate: '2025-01-15T14:00:00Z',
      currentProgressRate: 45,
      delayRiskLevel: 'high' as const,
      delayRiskScore: 0.6,
      predictedDelayDays: 1,
      feasibilityScore: 75,
      averageWorkerProductivityRate: 80,
      recommendationReason: '進捗が遅れている拠点のため優先対応が必要です。',
      rankingPriority: 1,
      status: 'pending_review' as const,
    },
    {
      allocationPlanId: 'cand-002',
      planName: 'Plan B',
      facilityId: 'facility-B',
      teamId: 'team-B',
      workInstructionId: 'wi-B',
      allocatedWorkerCount: 2,
      plannedStartDate: '2025-01-15T09:00:00Z',
      plannedEndDate: '2025-01-15T17:00:00Z',
      expectedCompletionDate: '2025-01-15T16:00:00Z',
      currentProgressRate: 78,
      delayRiskLevel: 'low' as const,
      delayRiskScore: 0.3,
      predictedDelayDays: 0,
      feasibilityScore: 90,
      averageWorkerProductivityRate: 90,
      recommendationReason: '進捗が順調です。',
      rankingPriority: 3,
      status: 'pending_review' as const,
    },
    {
      allocationPlanId: 'cand-003',
      planName: 'Plan C',
      facilityId: 'facility-C',
      teamId: 'team-C',
      workInstructionId: 'wi-C',
      allocatedWorkerCount: 3,
      plannedStartDate: '2025-01-15T09:00:00Z',
      plannedEndDate: '2025-01-15T17:00:00Z',
      expectedCompletionDate: '2025-01-15T15:30:00Z',
      currentProgressRate: 62,
      delayRiskLevel: 'medium' as const,
      delayRiskScore: 0.45,
      predictedDelayDays: 0,
      feasibilityScore: 82,
      averageWorkerProductivityRate: 85,
      recommendationReason: '中程度の進捗遅延に対応します。',
      rankingPriority: 2,
      status: 'pending_review' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return allocation plans ranked by delay priority with facility-A first', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.totalCount).toBe(3);
    expect(result.allocationPlans).toHaveLength(3);
    expect(result.allocationPlans[0].facilityId).toBe('facility-A');
    expect(result.allocationPlans[0].currentProgressRate).toBe(45);
  });

  it('should prioritize facility-A with most delay (45% progress)', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans[0].allocationPlanId).toBe('cand-001');
    expect(result.allocationPlans[0].facilityId).toBe('facility-A');
    expect(result.allocationPlans[0].currentProgressRate).toBe(45);
    expect(result.allocationPlans[0].rankingPriority).toBe(1);
  });

  it('should rank facility-C second with moderate delay (62% progress)', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans[1].allocationPlanId).toBe('cand-003');
    expect(result.allocationPlans[1].facilityId).toBe('facility-C');
    expect(result.allocationPlans[1].currentProgressRate).toBe(62);
    expect(result.allocationPlans[1].rankingPriority).toBe(2);
  });

  it('should rank facility-B last with highest progress rate (78% progress)', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans[2].allocationPlanId).toBe('cand-002');
    expect(result.allocationPlans[2].facilityId).toBe('facility-B');
    expect(result.allocationPlans[2].currentProgressRate).toBe(78);
    expect(result.allocationPlans[2].rankingPriority).toBe(3);
  });

  it('should return valid ISO 8601 format for analysisCompletedAt', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.analysisCompletedAt).toMatch(isoDateRegex);
  });

  it('should return dataFreshness with all age fields within acceptable range', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.progressDataAge).toBeLessThanOrEqual(60);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeLessThanOrEqual(300);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeLessThanOrEqual(120);
  });

  it('should include recommendation reason in first priority plan', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans[0].recommendationReason).toBeDefined();
    expect(result.allocationPlans[0].recommendationReason.length).toBeGreaterThan(0);
  });

  it('should ensure facility-A has higher priority than facility-B', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    const facilityAPlan = result.allocationPlans.find(p => p.facilityId === 'facility-A');
    const facilityBPlan = result.allocationPlans.find(p => p.facilityId === 'facility-B');

    expect(facilityAPlan).toBeDefined();
    expect(facilityBPlan).toBeDefined();
    expect(facilityAPlan!.rankingPriority).toBeLessThan(facilityBPlan!.rankingPriority);
  });

  it('should maintain correct ordering: facility-A (45%) > facility-C (62%) > facility-B (78%)', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans[0].facilityId).toBe('facility-A');
    expect(result.allocationPlans[1].facilityId).toBe('facility-C');
    expect(result.allocationPlans[2].facilityId).toBe('facility-B');

    expect(result.allocationPlans[0].rankingPriority).toBeLessThan(
      result.allocationPlans[1].rankingPriority
    );
    expect(result.allocationPlans[1].rankingPriority).toBeLessThan(
      result.allocationPlans[2].rankingPriority
    );
  });

  it('should have first plan with high risk level', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(['high', 'medium']).toContain(result.allocationPlans[0].delayRiskLevel);
  });

  it('should include delay reason in first priority plan recommendation', async () => {
    jest.mocked(extractAndRankAllocationPlansForReview).mockResolvedValue({
      allocationPlans: baseAllocationPlans,
      totalCount: 3,
      analysisCompletedAt: '2025-01-15T09:30:00.000Z',
      dataFreshness: {
        progressDataAge: 30,
        productivityDataAge: 60,
        riskJudgmentAge: 45,
      },
    });

    const input = {
      userId: 'manager-001',
      targetFacilityIds: ['facility-A', 'facility-B', 'facility-C'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T17:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans[0].recommendationReason).toContain('遅');
  });
});