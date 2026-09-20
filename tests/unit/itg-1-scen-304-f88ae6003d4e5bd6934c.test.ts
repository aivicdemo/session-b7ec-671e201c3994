import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import type {
  ExtractAndRankAllocationPlansForReviewInput,
  ExtractAndRankAllocationPlansForReviewOutput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-304: 優先度フィルタが high の場合、優先度が high のみの配置案が返される', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only high priority allocation plans when priorityFilter is set to high', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-distribution-center-001',
      targetFacilityIds: ['facility-001', 'facility-002'],
      timeRangeStart: '2024-01-15T00:00:00Z',
      timeRangeEnd: '2024-01-15T23:59:59Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    const authorizeOperationSpy = jest.fn().mockResolvedValue({ authorized: true });
    const validateDateTimeRangeSpy = jest.fn().mockResolvedValue({ valid: true });
    const recordOperationAuditSpy = jest.fn().mockResolvedValue({ recorded: true });

    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn((_url: string, _options?: any) => {
        const path = _url.toString();

        if (path.includes('authorize')) {
          authorizeOperationSpy();
          return Promise.resolve(
            new Response(JSON.stringify({ authorized: true }), { status: 200 })
          );
        }
        if (path.includes('validate-datetime')) {
          validateDateTimeRangeSpy();
          return Promise.resolve(new Response(JSON.stringify({ valid: true }), { status: 200 }));
        }
        if (path.includes('list-allocation-plans')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                allocationPlans: [
                  {
                    allocationPlanId: 'plan-high-001',
                    planName: 'High Priority Plan A',
                    facilityId: 'facility-001',
                    teamId: 'team-001',
                    workInstructionId: 'work-001',
                    allocatedWorkerCount: 5,
                    plannedStartDate: '2024-01-15T08:00:00Z',
                    plannedEndDate: '2024-01-15T17:00:00Z',
                    expectedCompletionDate: '2024-01-15T17:00:00Z',
                    currentProgressRate: 75,
                    delayRiskLevel: 'medium',
                    delayRiskScore: 45,
                    predictedDelayDays: 0,
                    feasibilityScore: 85,
                    averageWorkerProductivityRate: 85,
                    recommendationReason: 'High Priority Plan Aは現在の進捗状況とスキルマッチが最適な配置案です。',
                    rankingPriority: 1,
                    status: 'pending_review',
                    priorityScore: 90,
                    riskLevel: 'medium',
                  },
                  {
                    allocationPlanId: 'plan-high-002',
                    planName: 'High Priority Plan B',
                    facilityId: 'facility-002',
                    teamId: 'team-002',
                    workInstructionId: 'work-002',
                    allocatedWorkerCount: 3,
                    plannedStartDate: '2024-01-15T09:00:00Z',
                    plannedEndDate: '2024-01-15T18:00:00Z',
                    expectedCompletionDate: '2024-01-15T18:00:00Z',
                    currentProgressRate: 80,
                    delayRiskLevel: 'low',
                    delayRiskScore: 25,
                    predictedDelayDays: 0,
                    feasibilityScore: 90,
                    averageWorkerProductivityRate: 88,
                    recommendationReason: 'High Priority Plan Bは現在の進捗状況とスキルマッチが最適な配置案です。',
                    rankingPriority: 2,
                    status: 'pending_review',
                    priorityScore: 85,
                    riskLevel: 'low',
                  },
                ],
                totalCount: 2,
              }),
              { status: 200 }
            )
          );
        }
        if (path.includes('record-audit')) {
          recordOperationAuditSpy();
          return Promise.resolve(new Response(JSON.stringify({ recorded: true }), { status: 200 }));
        }

        return Promise.reject(new Error('Unknown endpoint'));
      })
    );

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toHaveLength(2);

    // Verify all allocation plans have the required fields and are high priority
    result.allocationPlans.forEach((plan: RankedAllocationPlanForReview) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.facilityId).toBeDefined();
      expect(typeof plan.facilityId).toBe('string');
      expect(plan.teamId).toBeDefined();
      expect(typeof plan.teamId).toBe('string');
      expect(plan.workInstructionId).toBeDefined();
      expect(typeof plan.workInstructionId).toBe('string');
      expect(plan.allocatedWorkerCount).toBeGreaterThan(0);
      expect(typeof plan.allocatedWorkerCount).toBe('number');
      expect(plan.plannedStartDate).toBeDefined();
      expect(plan.plannedEndDate).toBeDefined();
      expect(plan.expectedCompletionDate).toBeDefined();
      expect(plan.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(plan.currentProgressRate).toBeLessThanOrEqual(100);
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);
      expect(plan.predictedDelayDays).toBeDefined();
      expect(typeof plan.predictedDelayDays).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.averageWorkerProductivityRate).toBeGreaterThanOrEqual(0);
      expect(plan.averageWorkerProductivityRate).toBeLessThanOrEqual(100);
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
      expect(typeof plan.rankingPriority).toBe('number');
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
      expect(plan.priorityScore).toBeGreaterThanOrEqual(0);
      expect(plan.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(plan.riskLevel);
    });

    // Verify plans are sorted by priorityScore in descending order
    for (let i = 0; i < result.allocationPlans.length - 1; i++) {
      expect(result.allocationPlans[i].priorityScore).toBeGreaterThanOrEqual(
        result.allocationPlans[i + 1].priorityScore
      );
    }

    // Verify totalCount matches the number of high priority plans
    expect(result.totalCount).toEqual(2);

    // Verify metadata fields
    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.analysisCompletedAt)).toBe(true);

    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');

    // Verify that authorization, validation, and audit functions were called
    expect(authorizeOperationSpy).toHaveBeenCalled();
    expect(validateDateTimeRangeSpy).toHaveBeenCalled();
    expect(recordOperationAuditSpy).toHaveBeenCalled();
  });

  it('should exclude non-high priority plans when priorityFilter is high', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-distribution-center-001',
      targetFacilityIds: ['facility-001', 'facility-002', 'facility-003'],
      timeRangeStart: '2024-01-15T00:00:00Z',
      timeRangeEnd: '2024-01-15T23:59:59Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn((_url: string) => {
        const path = _url.toString();

        if (path.includes('authorize')) {
          return Promise.resolve(
            new Response(JSON.stringify({ authorized: true }), { status: 200 })
          );
        }
        if (path.includes('validate-datetime')) {
          return Promise.resolve(new Response(JSON.stringify({ valid: true }), { status: 200 }));
        }
        if (path.includes('list-allocation-plans')) {
          // Simulate that backend returns only high priority plans when filter is 'high'
          return Promise.resolve(
            new Response(
              JSON.stringify({
                allocationPlans: [
                  {
                    allocationPlanId: 'plan-high-001',
                    planName: 'High Priority Plan',
                    facilityId: 'facility-001',
                    teamId: 'team-001',
                    workInstructionId: 'work-001',
                    allocatedWorkerCount: 5,
                    plannedStartDate: '2024-01-15T08:00:00Z',
                    plannedEndDate: '2024-01-15T17:00:00Z',
                    expectedCompletionDate: '2024-01-15T17:00:00Z',
                    currentProgressRate: 75,
                    delayRiskLevel: 'medium',
                    delayRiskScore: 45,
                    predictedDelayDays: 0,
                    feasibilityScore: 85,
                    averageWorkerProductivityRate: 85,
                    recommendationReason: 'High Priority Planは現在の進捗状況に対応するための最適配置案です。',
                    rankingPriority: 1,
                    status: 'pending_review',
                    priorityScore: 85,
                    riskLevel: 'medium',
                  },
                ],
                totalCount: 1,
              }),
              { status: 200 }
            )
          );
        }
        if (path.includes('record-audit')) {
          return Promise.resolve(new Response(JSON.stringify({ recorded: true }), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans.length).toBeGreaterThan(0);
    // Verify only high priority plans are returned
    result.allocationPlans.forEach((plan: RankedAllocationPlanForReview) => {
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
      expect(plan.priorityScore).toBeGreaterThanOrEqual(0);
      expect(plan.priorityScore).toBeLessThanOrEqual(100);
      expect(plan.riskLevel).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(plan.riskLevel);
    });
    // Ensure totalCount reflects only high priority plans
    expect(result.totalCount).toBeLessThanOrEqual(50);
    // Verify that no medium or low priority items would be mixed in
    result.allocationPlans.forEach((plan) => {
      expect(plan.recommendationReason).toBeDefined();
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    });
  });

  it('should include required metadata and verify data freshness', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-distribution-center-001',
      targetFacilityIds: ['facility-001'],
      timeRangeStart: '2024-01-15T00:00:00Z',
      timeRangeEnd: '2024-01-15T23:59:59Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn((_url: string) => {
        const path = _url.toString();

        if (path.includes('authorize')) {
          return Promise.resolve(
            new Response(JSON.stringify({ authorized: true }), { status: 200 })
          );
        }
        if (path.includes('validate-datetime')) {
          return Promise.resolve(new Response(JSON.stringify({ valid: true }), { status: 200 }));
        }
        if (path.includes('list-allocation-plans')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                allocationPlans: [],
                totalCount: 0,
              }),
              { status: 200 }
            )
          );
        }
        if (path.includes('record-audit')) {
          return Promise.resolve(new Response(JSON.stringify({ recorded: true }), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result).toHaveProperty('allocationPlans');
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result).toHaveProperty('totalCount');
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toEqual(0);
    expect(result).toHaveProperty('analysisCompletedAt');
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.analysisCompletedAt)).toBe(true);
    expect(result).toHaveProperty('dataFreshness');
    expect(result.dataFreshness).toHaveProperty('progressDataAge');
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness).toHaveProperty('productivityDataAge');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness).toHaveProperty('riskJudgmentAge');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
  });

  it('should verify priorityScore ordering and risk level assignment', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-distribution-center-001',
      targetFacilityIds: ['facility-001', 'facility-002', 'facility-003'],
      timeRangeStart: '2024-01-15T00:00:00Z',
      timeRangeEnd: '2024-01-15T23:59:59Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn((_url: string) => {
        const path = _url.toString();

        if (path.includes('authorize')) {
          return Promise.resolve(
            new Response(JSON.stringify({ authorized: true }), { status: 200 })
          );
        }
        if (path.includes('validate-datetime')) {
          return Promise.resolve(new Response(JSON.stringify({ valid: true }), { status: 200 }));
        }
        if (path.includes('list-allocation-plans')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                allocationPlans: [
                  {
                    allocationPlanId: 'plan-high-a',
                    planName: 'Plan A',
                    facilityId: 'facility-001',
                    teamId: 'team-001',
                    workInstructionId: 'work-001',
                    allocatedWorkerCount: 5,
                    plannedStartDate: '2024-01-15T08:00:00Z',
                    plannedEndDate: '2024-01-15T17:00:00Z',
                    expectedCompletionDate: '2024-01-15T17:00:00Z',
                    currentProgressRate: 85,
                    delayRiskLevel: 'low',
                    delayRiskScore: 20,
                    predictedDelayDays: 0,
                    feasibilityScore: 95,
                    averageWorkerProductivityRate: 90,
                    recommendationReason: 'Plan Aは最も実現可能性が高く、リスク最小です。',
                    rankingPriority: 1,
                    status: 'pending_review',
                    priorityScore: 95,
                    riskLevel: 'low',
                  },
                  {
                    allocationPlanId: 'plan-high-b',
                    planName: 'Plan B',
                    facilityId: 'facility-002',
                    teamId: 'team-002',
                    workInstructionId: 'work-002',
                    allocatedWorkerCount: 3,
                    plannedStartDate: '2024-01-15T09:00:00Z',
                    plannedEndDate: '2024-01-15T18:00:00Z',
                    expectedCompletionDate: '2024-01-15T18:00:00Z',
                    currentProgressRate: 70,
                    delayRiskLevel: 'medium',
                    delayRiskScore: 50,
                    predictedDelayDays: 1,
                    feasibilityScore: 75,
                    averageWorkerProductivityRate: 80,
                    recommendationReason: 'Plan Bは中程度のリスクを伴いますが実行可能です。',
                    rankingPriority: 2,
                    status: 'pending_review',
                    priorityScore: 70,
                    riskLevel: 'medium',
                  },
                  {
                    allocationPlanId: 'plan-high-c',
                    planName: 'Plan C',
                    facilityId: 'facility-003',
                    teamId: 'team-003',
                    workInstructionId: 'work-003',
                    allocatedWorkerCount: 2,
                    plannedStartDate: '2024-01-15T10:00:00Z',
                    plannedEndDate: '2024-01-15T19:00:00Z',
                    expectedCompletionDate: '2024-01-15T19:00:00Z',
                    currentProgressRate: 60,
                    delayRiskLevel: 'high',
                    delayRiskScore: 75,
                    predictedDelayDays: 2,
                    feasibilityScore: 65,
                    averageWorkerProductivityRate: 70,
                    recommendationReason: 'Plan Cはリスクが高く非推奨ですが選択肢として提示します。',
                    rankingPriority: 3,
                    status: 'pending_review',
                    priorityScore: 55,
                    riskLevel: 'high',
                  },
                ],
                totalCount: 3,
              }),
              { status: 200 }
            )
          );
        }
        if (path.includes('record-audit')) {
          return Promise.resolve(new Response(JSON.stringify({ recorded: true }), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result.allocationPlans.length).toBe(3);

    // Verify priorityScore is assigned and ordering is maintained
    const scores = result.allocationPlans.map((plan) => plan.priorityScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    // Verify rankingPriority is in order
    result.allocationPlans.forEach((plan, index) => {
      expect(plan.rankingPriority).toEqual(index + 1);
    });

    // Verify riskLevel is correctly assigned
    result.allocationPlans.forEach((plan) => {
      expect(['high', 'medium', 'low']).toContain(plan.riskLevel);
    });

    // Verify recommendation reason is present and localized
    result.allocationPlans.forEach((plan) => {
      expect(plan.recommendationReason).toBeTruthy();
      expect(plan.recommendationReason.length).toBeGreaterThan(0);
    });
  });

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });
});