import { extractAndRankAllocationPlansForReview, ExtractAndRankAllocationPlansForReviewInput, ExtractAndRankAllocationPlansForReviewOutput, RankedAllocationPlanForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-307: 優先度フィルタが all の場合、全ての配置案が返される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true, role: 'center_chief' });
    mockValidateDateTimeRange = jest.fn().mockResolvedValue({ valid: true });
    mockListAllocationPlansByCondition = jest.fn();
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest.fn();
    mockGetLatestProductivityDataByWorker = jest.fn();
    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);
  });

  it('should return all allocation plans regardless of priority when priorityFilter is "all"', async () => {
    const mockUserId = 'user-center-chief-001';
    const mockFacilityIds = ['facility-001', 'facility-002'];
    const mockTimeRangeStart = '2024-01-01T00:00:00Z';
    const mockTimeRangeEnd = '2024-01-31T23:59:59Z';

    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: mockUserId,
      targetFacilityIds: mockFacilityIds,
      timeRangeStart: mockTimeRangeStart,
      timeRangeEnd: mockTimeRangeEnd,
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    // Mock allocation plans: 3 high priority + 4 medium priority + 2 low priority = 9 total
    const mockAllocationPlans = [
      // High priority plans (3)
      {
        allocationPlanId: 'plan-high-001',
        planName: 'High Priority Plan 1',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-05T08:00:00Z',
        plannedEndDate: '2024-01-05T17:00:00Z',
        expectedCompletionDate: '2024-01-05T16:00:00Z',
        currentProgressRate: 75,
        priority: 'high',
      },
      {
        allocationPlanId: 'plan-high-002',
        planName: 'High Priority Plan 2',
        facilityId: 'facility-001',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-06T08:00:00Z',
        plannedEndDate: '2024-01-06T17:00:00Z',
        expectedCompletionDate: '2024-01-06T15:00:00Z',
        currentProgressRate: 60,
        priority: 'high',
      },
      {
        allocationPlanId: 'plan-high-003',
        planName: 'High Priority Plan 3',
        facilityId: 'facility-002',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 4,
        plannedStartDate: '2024-01-07T08:00:00Z',
        plannedEndDate: '2024-01-07T17:00:00Z',
        expectedCompletionDate: '2024-01-07T14:00:00Z',
        currentProgressRate: 50,
        priority: 'high',
      },
      // Medium priority plans (4)
      {
        allocationPlanId: 'plan-medium-001',
        planName: 'Medium Priority Plan 1',
        facilityId: 'facility-001',
        teamId: 'team-004',
        workInstructionId: 'work-004',
        allocatedWorkerCount: 2,
        plannedStartDate: '2024-01-08T08:00:00Z',
        plannedEndDate: '2024-01-08T17:00:00Z',
        expectedCompletionDate: '2024-01-08T16:30:00Z',
        currentProgressRate: 80,
        priority: 'medium',
      },
      {
        allocationPlanId: 'plan-medium-002',
        planName: 'Medium Priority Plan 2',
        facilityId: 'facility-001',
        teamId: 'team-005',
        workInstructionId: 'work-005',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-09T08:00:00Z',
        plannedEndDate: '2024-01-09T17:00:00Z',
        expectedCompletionDate: '2024-01-09T16:00:00Z',
        currentProgressRate: 70,
        priority: 'medium',
      },
      {
        allocationPlanId: 'plan-medium-003',
        planName: 'Medium Priority Plan 3',
        facilityId: 'facility-002',
        teamId: 'team-006',
        workInstructionId: 'work-006',
        allocatedWorkerCount: 2,
        plannedStartDate: '2024-01-10T08:00:00Z',
        plannedEndDate: '2024-01-10T17:00:00Z',
        expectedCompletionDate: '2024-01-10T15:30:00Z',
        currentProgressRate: 65,
        priority: 'medium',
      },
      {
        allocationPlanId: 'plan-medium-004',
        planName: 'Medium Priority Plan 4',
        facilityId: 'facility-002',
        teamId: 'team-007',
        workInstructionId: 'work-007',
        allocatedWorkerCount: 4,
        plannedStartDate: '2024-01-11T08:00:00Z',
        plannedEndDate: '2024-01-11T17:00:00Z',
        expectedCompletionDate: '2024-01-11T14:00:00Z',
        currentProgressRate: 55,
        priority: 'medium',
      },
      // Low priority plans (2)
      {
        allocationPlanId: 'plan-low-001',
        planName: 'Low Priority Plan 1',
        facilityId: 'facility-001',
        teamId: 'team-008',
        workInstructionId: 'work-008',
        allocatedWorkerCount: 1,
        plannedStartDate: '2024-01-12T08:00:00Z',
        plannedEndDate: '2024-01-12T17:00:00Z',
        expectedCompletionDate: '2024-01-12T17:00:00Z',
        currentProgressRate: 45,
        priority: 'low',
      },
      {
        allocationPlanId: 'plan-low-002',
        planName: 'Low Priority Plan 2',
        facilityId: 'facility-002',
        teamId: 'team-009',
        workInstructionId: 'work-009',
        allocatedWorkerCount: 2,
        plannedStartDate: '2024-01-13T08:00:00Z',
        plannedEndDate: '2024-01-13T17:00:00Z',
        expectedCompletionDate: '2024-01-13T16:00:00Z',
        currentProgressRate: 40,
        priority: 'low',
      },
    ];

    mockListAllocationPlansByCondition.mockResolvedValue({
      allocationPlans: mockAllocationPlans,
      totalCount: 9,
    });

    // Mock delay risk judgment data for each plan
    const mockDelayRiskData: { [key: string]: any } = {};
    mockAllocationPlans.forEach((plan, index) => {
      const riskLevels = ['critical', 'high', 'medium', 'low'];
      mockDelayRiskData[plan.workInstructionId] = {
        riskLevel: riskLevels[index % 4],
        delayRiskScore: 100 - (index * 10),
        predictedDelayDays: Math.max(0, 5 - (index % 3)),
      };
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockImplementation((facilityId: string, teamId: string) => {
      const plan = mockAllocationPlans.find(p => p.facilityId === facilityId && p.teamId === teamId);
      if (plan) {
        return Promise.resolve(mockDelayRiskData[plan.workInstructionId]);
      }
      return Promise.resolve(null);
    });

    // Mock productivity data for workers
    mockGetLatestProductivityDataByWorker.mockImplementation((workerId: string) => {
      return Promise.resolve({
        productivityRate: 75 + Math.random() * 15,
        qualityScore: 80 + Math.random() * 15,
      });
    });

    const result: ExtractAndRankAllocationPlansForReviewOutput = await extractAndRankAllocationPlansForReview(input);

    // Verify authorizeOperation was called
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(mockUserId, 'center_chief');

    // Verify validateDateTimeRange was called
    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(mockTimeRangeStart, mockTimeRangeEnd);

    // Verify listAllocationPlansByCondition was called with correct parameters
    expect(mockListAllocationPlansByCondition).toHaveBeenCalled();
    const callArgs = mockListAllocationPlansByCondition.mock.calls[0][0];
    expect(callArgs.priorityFilter).toBe('all');
    expect(callArgs.targetFacilityIds).toEqual(mockFacilityIds);

    // Verify recordOperationAudit was called
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);

    // Verify all 9 plans are returned
    expect(result.allocationPlans.length).toBe(9);
    expect(result.totalCount).toBe(9);

    // Verify each returned plan has required ranking information
    result.allocationPlans.forEach((plan: RankedAllocationPlanForReview) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkerCount).toBeDefined();
      expect(typeof plan.allocatedWorkerCount).toBe('number');
      expect(plan.plannedStartDate).toBeDefined();
      expect(plan.plannedEndDate).toBeDefined();
      expect(plan.expectedCompletionDate).toBeDefined();
      expect(plan.currentProgressRate).toBeDefined();
      expect(typeof plan.currentProgressRate).toBe('number');
      expect(plan.delayRiskLevel).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(plan.delayRiskLevel);
      expect(plan.delayRiskScore).toBeDefined();
      expect(typeof plan.delayRiskScore).toBe('number');
      expect(plan.predictedDelayDays).toBeDefined();
      expect(typeof plan.predictedDelayDays).toBe('number');
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.averageWorkerProductivityRate).toBeDefined();
      expect(typeof plan.averageWorkerProductivityRate).toBe('number');
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.rankingPriority).toBeDefined();
      expect(typeof plan.rankingPriority).toBe('number');
      expect(plan.status).toBeDefined();
      expect(['pending_review', 'approved', 'rejected', 'executing']).toContain(plan.status);
    });

    // Verify prioritizeAllocationCandidates was executed: all plans have priorityScore computed
    result.allocationPlans.forEach((plan: RankedAllocationPlanForReview) => {
      // priorityScore is the basis for ranking; verify it is present and within expected range
      expect(typeof plan.rankingPriority).toBe('number');
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
      expect(plan.rankingPriority).toBeLessThanOrEqual(9);
    });

    // Verify plans are sorted by rankingPriority in ascending order (1 is highest priority)
    for (let i = 0; i < result.allocationPlans.length - 1; i++) {
      const currentPriority = result.allocationPlans[i].rankingPriority;
      const nextPriority = result.allocationPlans[i + 1].rankingPriority;
      expect(currentPriority).toBeLessThanOrEqual(nextPriority);
    }

    // Verify all original plan variations are present (high, medium, low priority mix)
    const returnedPlanIds = result.allocationPlans.map((plan: RankedAllocationPlanForReview) => plan.allocationPlanId);
    expect(returnedPlanIds.length).toBe(9);

    // Verify that plans from all original priority levels are included (not filtered by priority)
    const originalPriorities = mockAllocationPlans.map(p => p.priority);
    const returnedPriorityDistribution: { [key: string]: number } = {};
    mockAllocationPlans.forEach(originalPlan => {
      const isReturned = result.allocationPlans.some(
        (returnedPlan: RankedAllocationPlanForReview) => returnedPlan.allocationPlanId === originalPlan.allocationPlanId
      );
      if (isReturned) {
        const priority = originalPlan.priority;
        returnedPriorityDistribution[priority] = (returnedPriorityDistribution[priority] || 0) + 1;
      }
    });

    // Verify all priority levels are represented
    expect(returnedPriorityDistribution['high']).toBe(3);
    expect(returnedPriorityDistribution['medium']).toBe(4);
    expect(returnedPriorityDistribution['low']).toBe(2);

    // Verify analysisCompletedAt is ISO 8601 format
    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.analysisCompletedAt)).toBe(true);

    // Verify dataFreshness structure with proper types and ranges
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeDefined();
    expect(result.dataFreshness.productivityDataAge).toBeDefined();
    expect(result.dataFreshness.riskJudgmentAge).toBeDefined();
    expect(typeof result.dataFreshness.progressDataAge).toBe('number');
    expect(typeof result.dataFreshness.productivityDataAge).toBe('number');
    expect(typeof result.dataFreshness.riskJudgmentAge).toBe('number');
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.dataFreshness.progressDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.productivityDataAge)).toBe(true);
    expect(Number.isInteger(result.dataFreshness.riskJudgmentAge)).toBe(true);

    // Verify that plans from all risk levels are included in the result
    const plansByRiskLevel = {
      critical: result.allocationPlans.filter((p: RankedAllocationPlanForReview) => p.delayRiskLevel === 'critical'),
      high: result.allocationPlans.filter((p: RankedAllocationPlanForReview) => p.delayRiskLevel === 'high'),
      medium: result.allocationPlans.filter((p: RankedAllocationPlanForReview) => p.delayRiskLevel === 'medium'),
      low: result.allocationPlans.filter((p: RankedAllocationPlanForReview) => p.delayRiskLevel === 'low'),
    };

    // Verify that the filter 'all' includes diverse risk levels
    const totalPlansWithRiskLevels = Object.values(plansByRiskLevel).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalPlansWithRiskLevels).toBe(9);
  });
});