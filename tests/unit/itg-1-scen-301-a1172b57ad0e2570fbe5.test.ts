import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import type {
  ExtractAndRankAllocationPlansForReviewInput,
  ExtractAndRankAllocationPlansForReviewOutput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-301: extractAndRankAllocationPlansForReview', () => {
  let mockAuthorizeOperation: ReturnType<typeof vi.fn>;
  let mockValidateDateTimeRange: ReturnType<typeof vi.fn>;
  let mockListAllocationPlansByCondition: ReturnType<typeof vi.fn>;
  let mockGetLatestProductivityDataByWorker: ReturnType<typeof vi.fn>;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: ReturnType<typeof vi.fn>;
  let mockRecordOperationAudit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAuthorizeOperation = vi.fn().mockResolvedValue({ authorized: true, role: 'CENTER_LEAD' });
    mockValidateDateTimeRange = vi.fn().mockResolvedValue({ valid: true });
    mockListAllocationPlansByCondition = vi.fn().mockResolvedValue({
      allocationPlans: [
        {
          candidateId: 'PLAN_001',
          facilityId: 'FAC_001',
          proposedWorkers: ['WORKER_001', 'WORKER_002'],
          estimatedCompletionTime: '2025-01-15T16:00:00Z',
          riskScore: 25,
        },
        {
          candidateId: 'PLAN_002',
          facilityId: 'FAC_002',
          proposedWorkers: ['WORKER_003'],
          estimatedCompletionTime: '2025-01-15T17:00:00Z',
          riskScore: 45,
        },
        {
          candidateId: 'PLAN_003',
          facilityId: 'FAC_001',
          proposedWorkers: ['WORKER_004', 'WORKER_005'],
          estimatedCompletionTime: '2025-01-15T18:30:00Z',
          riskScore: 65,
        },
      ],
    });
    mockGetLatestProductivityDataByWorker = vi.fn().mockImplementation((workerIds) => {
      const productivityMap: Record<string, { workerId: string; productivityScore: number; skillLevel: number; facilityId: string }> = {
        WORKER_001: { workerId: 'WORKER_001', productivityScore: 92, skillLevel: 4, facilityId: 'FAC_001' },
        WORKER_002: { workerId: 'WORKER_002', productivityScore: 92, skillLevel: 4, facilityId: 'FAC_001' },
        WORKER_003: { workerId: 'WORKER_003', productivityScore: 78, skillLevel: 3, facilityId: 'FAC_002' },
        WORKER_004: { workerId: 'WORKER_004', productivityScore: 65, skillLevel: 2, facilityId: 'FAC_001' },
        WORKER_005: { workerId: 'WORKER_005', productivityScore: 65, skillLevel: 2, facilityId: 'FAC_001' },
      };
      return Promise.resolve(
        workerIds.map((id: string) => productivityMap[id] || { workerId: id, productivityScore: 0, skillLevel: 0, facilityId: '' })
      );
    });
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = vi.fn().mockResolvedValue({
      FAC_001: { riskScore: 35, riskLevel: 'medium' },
      FAC_002: { riskScore: 50, riskLevel: 'high' },
    });
    mockRecordOperationAudit = vi.fn().mockResolvedValue({ recorded: true });

    vi.stubGlobal('authorizeOperation', mockAuthorizeOperation);
    vi.stubGlobal('validateDateTimeRange', mockValidateDateTimeRange);
    vi.stubGlobal('listAllocationPlansByCondition', mockListAllocationPlansByCondition);
    vi.stubGlobal('getLatestProductivityDataByWorker', mockGetLatestProductivityDataByWorker);
    vi.stubGlobal('getRecentDelayRiskJudgmentByFacilityAndTeam', mockGetRecentDelayRiskJudgmentByFacilityAndTeam);
    vi.stubGlobal('recordOperationAudit', mockRecordOperationAudit);
  });

  it('should extract and rank allocation plans based on productivity data', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const output: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    expect(output).toBeDefined();
    expect(output.allocationPlans).toHaveLength(3);
    expect(output.totalCount).toBe(3);
    expect(output.analysisCompletedAt).toBeDefined();
    expect(output.dataFreshness).toBeDefined();
    expect(output.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
  });

  it('should call getLatestProductivityDataByWorker with all workers from allocation plans', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    await extractAndRankAllocationPlansForReview(input);

    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalled();
    const callArgs = mockGetLatestProductivityDataByWorker.mock.calls[0][0];
    const expectedWorkers = ['WORKER_001', 'WORKER_002', 'WORKER_003', 'WORKER_004', 'WORKER_005'];
    expect(callArgs).toEqual(expect.arrayContaining(expectedWorkers));
  });

  it('should rank allocation plans by productivity score in descending order', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const output: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    expect(output.allocationPlans[0].averageWorkerProductivityRate).toBeGreaterThanOrEqual(
      output.allocationPlans[1].averageWorkerProductivityRate
    );
    expect(output.allocationPlans[1].averageWorkerProductivityRate).toBeGreaterThanOrEqual(
      output.allocationPlans[2].averageWorkerProductivityRate
    );
  });

  it('should include priorityScore, riskLevel, and recommendationReason in each allocation plan', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const output: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    output.allocationPlans.forEach((plan: RankedAllocationPlanForReview) => {
      expect(plan.rankingPriority).toBeDefined();
      expect(plan.delayRiskLevel).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    });
  });

  it('should include productivity score based on workers from allocation plans', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const output: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    expect(output.allocationPlans[0].averageWorkerProductivityRate).toBe(92);
    expect(output.allocationPlans[1].averageWorkerProductivityRate).toBe(78);
    expect(output.allocationPlans[2].averageWorkerProductivityRate).toBe(65);
  });

  it('should return dataFreshness with productivityDataAge in seconds', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const output: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    expect(output.dataFreshness).toBeDefined();
    expect(output.dataFreshness.productivityDataAge).toBeDefined();
    expect(typeof output.dataFreshness.productivityDataAge).toBe('number');
    expect(output.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
  });

  it('should verify getLatestProductivityDataByWorker called exactly once for all workers', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    await extractAndRankAllocationPlansForReview(input);

    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalledTimes(1);
  });

  it('should include analysisCompletedAt in ISO 8601 format', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'CENTER_LEAD_001',
      targetFacilityIds: ['FAC_001', 'FAC_002'],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const output: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    expect(output.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    const date = new Date(output.analysisCompletedAt);
    expect(date.toString()).not.toBe('Invalid Date');
  });
});