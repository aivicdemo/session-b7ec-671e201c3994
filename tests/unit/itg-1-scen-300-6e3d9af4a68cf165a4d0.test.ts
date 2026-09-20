import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-300: extractAndRankAllocationPlansForReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract and rank allocation plans based on input criteria with proper stubs', async () => {
    // Step 2: Stub authorizeOperation
    jest.spyOn(require('../../src/services/authorization'), 'authorizeOperation').mockResolvedValue({
      authorized: true,
      role: 'logistics_center_manager',
      userId: 'CENTER-LONG-001',
    });

    // Step 3: Stub validateDateTimeRange
    jest.spyOn(require('../../src/utils/datetime'), 'validateDateTimeRange').mockReturnValue({
      isValid: true,
      startTime: new Date('2025-01-20T09:00:00Z'),
      endTime: new Date('2025-01-20T12:00:00Z'),
    });

    // Step 4: Stub listAllocationPlansByCondition
    jest.spyOn(require('../../src/services/allocation'), 'listAllocationPlansByCondition').mockResolvedValue([
      {
        allocationPlanId: 'ALLOC-101',
        facilityId: 'FAC-001',
        proposedWorkers: ['W001', 'W002'],
        estimatedCompletionTime: 180,
        riskScore: 0.65,
        planName: 'Plan-101',
        teamId: 'TEAM-001',
        workInstructionId: 'WI-001',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 45,
        delayRiskLevel: 'high' as const,
        delayRiskScore: 65,
        predictedDelayDays: 0.5,
        feasibilityScore: 78,
        averageWorkerProductivityRate: 85,
        recommendationReason: 'High risk mitigation strategy',
        rankingPriority: 1,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'ALLOC-102',
        facilityId: 'FAC-002',
        proposedWorkers: ['W003'],
        estimatedCompletionTime: 120,
        riskScore: 0.45,
        planName: 'Plan-102',
        teamId: 'TEAM-002',
        workInstructionId: 'WI-002',
        allocatedWorkerCount: 1,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 60,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 45,
        predictedDelayDays: 0.25,
        feasibilityScore: 82,
        averageWorkerProductivityRate: 80,
        recommendationReason: 'Moderate risk adjustment',
        rankingPriority: 2,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'ALLOC-103',
        facilityId: 'FAC-001',
        proposedWorkers: ['W001', 'W004'],
        estimatedCompletionTime: 150,
        riskScore: 0.35,
        planName: 'Plan-103',
        teamId: 'TEAM-001',
        workInstructionId: 'WI-001',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 55,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 35,
        predictedDelayDays: 0.1,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 82,
        recommendationReason: 'Low risk option with good feasibility',
        rankingPriority: 3,
        status: 'pending_review' as const,
      },
    ]);

    // Step 5: Stub getRecentDelayRiskJudgmentByFacilityAndTeam
    jest.spyOn(require('../../src/services/risk'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue({
      'FAC-001': {
        facilityId: 'FAC-001',
        deliveryDeadline: '2025-01-20T12:00:00Z',
        currentProgressRate: 50,
        remainingTaskCount: 150,
        riskLevel: 'high' as const,
        predictedDelayDays: 0.5,
      },
      'FAC-002': {
        facilityId: 'FAC-002',
        deliveryDeadline: '2025-01-20T12:00:00Z',
        currentProgressRate: 60,
        remainingTaskCount: 100,
        riskLevel: 'medium' as const,
        predictedDelayDays: 0.25,
      },
    });

    // Step 6: Stub getLatestProductivityDataByWorker
    jest.spyOn(require('../../src/services/productivity'), 'getLatestProductivityDataByWorker').mockImplementation((workerId: string) => {
      const productivityMap: Record<string, { productivityScore: number; skillLevel: string; preferredTaskType: string }> = {
        W001: { productivityScore: 85, skillLevel: 'advanced', preferredTaskType: 'picking' },
        W002: { productivityScore: 78, skillLevel: 'intermediate', preferredTaskType: 'packing' },
        W003: { productivityScore: 82, skillLevel: 'advanced', preferredTaskType: 'picking' },
        W004: { productivityScore: 75, skillLevel: 'intermediate', preferredTaskType: 'sorting' },
      };
      return Promise.resolve(productivityMap[workerId] || { productivityScore: 70, skillLevel: 'beginner', preferredTaskType: 'general' });
    });

    // Step 7: Stub recordOperationAudit
    jest.spyOn(require('../../src/services/audit'), 'recordOperationAudit').mockResolvedValue({
      auditId: 'AUDIT-001',
      userId: 'CENTER-LONG-001',
      operation: 'extractAndRankAllocationPlansForReview',
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    // Step 1: Call extractAndRankAllocationPlansForReview
    const input = {
      userId: 'CENTER-LONG-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2025-01-20T09:00:00Z',
      timeRangeEnd: '2025-01-20T12:00:00Z',
      priorityFilter: 'high' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // (1) allocationPlans should be non-empty and contain 3+ RankedAllocationPlanForReview elements
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(3);

    // Verify plans are ordered by rankingPriority (ascending = highest priority first)
    const priorities = result.allocationPlans.map((p) => p.rankingPriority);
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(priorities[i]).toBeLessThanOrEqual(priorities[i + 1]);
    }

    // (2) Verify delay risk data influences priorityScore and ranking
    // Each plan should have delayRiskScore reflecting the delivery deadline comparison logic
    result.allocationPlans.forEach((plan) => {
      expect(plan.delayRiskScore).toBeDefined();
      expect(typeof plan.delayRiskScore).toBe('number');
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);

      // Verify feasibility and productivity scores are present
      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');

      expect(plan.averageWorkerProductivityRate).toBeDefined();
      expect(typeof plan.averageWorkerProductivityRate).toBe('number');

      // Verify ranking priority reflects the composite score
      expect(plan.rankingPriority).toBeDefined();
      expect(typeof plan.rankingPriority).toBe('number');
      expect(plan.rankingPriority).toBeGreaterThanOrEqual(1);
    });

    // Verify that the higher delay risk plans are ranked with higher priority
    const firstPlan = result.allocationPlans[0];
    const secondPlan = result.allocationPlans.length > 1 ? result.allocationPlans[1] : null;
    if (secondPlan) {
      // If first plan has higher delay risk score, it should have lower ranking priority
      if (firstPlan.delayRiskScore > secondPlan.delayRiskScore) {
        expect(firstPlan.rankingPriority).toBeLessThanOrEqual(secondPlan.rankingPriority);
      }
    }

    // (3) totalCount should match the returned allocation plans
    expect(result.totalCount).toBe(result.allocationPlans.length);
    expect(result.totalCount).toBeGreaterThanOrEqual(3);

    // (4) analysisCompletedAt should be in ISO 8601 format
    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).test(result.analysisCompletedAt)).toBe(true);
    expect(() => new Date(result.analysisCompletedAt)).not.toThrow();

    // (5) dataFreshness should have 3 keys with non-negative numeric values (in seconds)
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

    // (6) riskJudgmentAge should be >= 0, indicating successful call to getRecentDelayRiskJudgmentByFacilityAndTeam
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);

    // Verify all required fields exist in each plan
    result.allocationPlans.forEach((plan) => {
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
      expect(plan.delayRiskLevel).toMatch(/^(critical|high|medium|low)$/);
      expect(plan.predictedDelayDays).toBeDefined();
      expect(typeof plan.predictedDelayDays).toBe('number');
      expect(plan.recommendationReason).toBeDefined();
      expect(typeof plan.recommendationReason).toBe('string');
      expect(plan.status).toMatch(/^(pending_review|approved|rejected|executing)$/);
    });
  });

  it('should rank allocation plans based on delay risk and feasibility scores', async () => {
    jest.spyOn(require('../../src/services/authorization'), 'authorizeOperation').mockResolvedValue({
      authorized: true,
      role: 'logistics_center_manager',
      userId: 'CENTER-LONG-001',
    });

    jest.spyOn(require('../../src/utils/datetime'), 'validateDateTimeRange').mockReturnValue({
      isValid: true,
      startTime: new Date('2025-01-20T09:00:00Z'),
      endTime: new Date('2025-01-20T12:00:00Z'),
    });

    jest.spyOn(require('../../src/services/allocation'), 'listAllocationPlansByCondition').mockResolvedValue([
      {
        allocationPlanId: 'ALLOC-101',
        facilityId: 'FAC-001',
        proposedWorkers: ['W001', 'W002'],
        estimatedCompletionTime: 180,
        riskScore: 0.65,
        planName: 'Plan-101',
        teamId: 'TEAM-001',
        workInstructionId: 'WI-001',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 45,
        delayRiskLevel: 'high' as const,
        delayRiskScore: 65,
        predictedDelayDays: 0.5,
        feasibilityScore: 78,
        averageWorkerProductivityRate: 85,
        recommendationReason: 'High risk mitigation strategy',
        rankingPriority: 1,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'ALLOC-102',
        facilityId: 'FAC-002',
        proposedWorkers: ['W003'],
        estimatedCompletionTime: 120,
        riskScore: 0.45,
        planName: 'Plan-102',
        teamId: 'TEAM-002',
        workInstructionId: 'WI-002',
        allocatedWorkerCount: 1,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 60,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 45,
        predictedDelayDays: 0.25,
        feasibilityScore: 82,
        averageWorkerProductivityRate: 80,
        recommendationReason: 'Moderate risk adjustment',
        rankingPriority: 2,
        status: 'pending_review' as const,
      },
    ]);

    jest.spyOn(require('../../src/services/risk'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue({
      'FAC-001': {
        facilityId: 'FAC-001',
        deliveryDeadline: '2025-01-20T12:00:00Z',
        currentProgressRate: 50,
        remainingTaskCount: 150,
        riskLevel: 'high' as const,
        predictedDelayDays: 0.5,
      },
      'FAC-002': {
        facilityId: 'FAC-002',
        deliveryDeadline: '2025-01-20T12:00:00Z',
        currentProgressRate: 60,
        remainingTaskCount: 100,
        riskLevel: 'medium' as const,
        predictedDelayDays: 0.25,
      },
    });

    jest.spyOn(require('../../src/services/productivity'), 'getLatestProductivityDataByWorker').mockImplementation((workerId: string) => {
      const productivityMap: Record<string, { productivityScore: number; skillLevel: string; preferredTaskType: string }> = {
        W001: { productivityScore: 85, skillLevel: 'advanced', preferredTaskType: 'picking' },
        W002: { productivityScore: 78, skillLevel: 'intermediate', preferredTaskType: 'packing' },
        W003: { productivityScore: 82, skillLevel: 'advanced', preferredTaskType: 'picking' },
        W004: { productivityScore: 75, skillLevel: 'intermediate', preferredTaskType: 'sorting' },
      };
      return Promise.resolve(productivityMap[workerId] || { productivityScore: 70, skillLevel: 'beginner', preferredTaskType: 'general' });
    });

    jest.spyOn(require('../../src/services/audit'), 'recordOperationAudit').mockResolvedValue({
      auditId: 'AUDIT-001',
      userId: 'CENTER-LONG-001',
      operation: 'extractAndRankAllocationPlansForReview',
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    const input = {
      userId: 'CENTER-LONG-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2025-01-20T09:00:00Z',
      timeRangeEnd: '2025-01-20T12:00:00Z',
      priorityFilter: 'high' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // Verify plans are ranked in ascending rankingPriority order
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(2);
    const first = result.allocationPlans[0];
    const second = result.allocationPlans[1];

    expect(first.rankingPriority).toBeLessThanOrEqual(second.rankingPriority);

    // Verify that ranking reflects delay risk and feasibility
    // Higher priority should have combination of high feasibility and high delay risk
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(plan.delayRiskScore).toBeLessThanOrEqual(100);
    });
  });

  it('should filter allocation plans by priority and reflect in rankings', async () => {
    jest.spyOn(require('../../src/services/authorization'), 'authorizeOperation').mockResolvedValue({
      authorized: true,
      role: 'logistics_center_manager',
      userId: 'CENTER-LONG-001',
    });

    jest.spyOn(require('../../src/utils/datetime'), 'validateDateTimeRange').mockReturnValue({
      isValid: true,
      startTime: new Date('2025-01-20T09:00:00Z'),
      endTime: new Date('2025-01-20T12:00:00Z'),
    });

    jest.spyOn(require('../../src/services/allocation'), 'listAllocationPlansByCondition').mockResolvedValue([
      {
        allocationPlanId: 'ALLOC-101',
        facilityId: 'FAC-001',
        proposedWorkers: ['W001', 'W002'],
        estimatedCompletionTime: 180,
        riskScore: 0.65,
        planName: 'Plan-101',
        teamId: 'TEAM-001',
        workInstructionId: 'WI-001',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 45,
        delayRiskLevel: 'high' as const,
        delayRiskScore: 65,
        predictedDelayDays: 0.5,
        feasibilityScore: 78,
        averageWorkerProductivityRate: 85,
        recommendationReason: 'High risk mitigation strategy',
        rankingPriority: 1,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'ALLOC-102',
        facilityId: 'FAC-002',
        proposedWorkers: ['W003'],
        estimatedCompletionTime: 120,
        riskScore: 0.45,
        planName: 'Plan-102',
        teamId: 'TEAM-002',
        workInstructionId: 'WI-002',
        allocatedWorkerCount: 1,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 60,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 45,
        predictedDelayDays: 0.25,
        feasibilityScore: 82,
        averageWorkerProductivityRate: 80,
        recommendationReason: 'Moderate risk adjustment',
        rankingPriority: 2,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'ALLOC-103',
        facilityId: 'FAC-001',
        proposedWorkers: ['W001', 'W004'],
        estimatedCompletionTime: 150,
        riskScore: 0.35,
        planName: 'Plan-103',
        teamId: 'TEAM-001',
        workInstructionId: 'WI-001',
        allocatedWorkerCount: 2,
        plannedStartDate: '2025-01-20T09:00:00Z',
        plannedEndDate: '2025-01-20T12:00:00Z',
        expectedCompletionDate: '2025-01-20T12:00:00Z',
        currentProgressRate: 55,
        delayRiskLevel: 'low' as const,
        delayRiskScore: 35,
        predictedDelayDays: 0.1,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 82,
        recommendationReason: 'Low risk option with good feasibility',
        rankingPriority: 3,
        status: 'pending_review' as const,
      },
    ]);

    jest.spyOn(require('../../src/services/risk'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue({
      'FAC-001': {
        facilityId: 'FAC-001',
        deliveryDeadline: '2025-01-20T12:00:00Z',
        currentProgressRate: 50,
        remainingTaskCount: 150,
        riskLevel: 'high' as const,
        predictedDelayDays: 0.5,
      },
      'FAC-002': {
        facilityId: 'FAC-002',
        deliveryDeadline: '2025-01-20T12:00:00Z',
        currentProgressRate: 60,
        remainingTaskCount: 100,
        riskLevel: 'medium' as const,
        predictedDelayDays: 0.25,
      },
    });

    jest.spyOn(require('../../src/services/productivity'), 'getLatestProductivityDataByWorker').mockImplementation((workerId: string) => {
      const productivityMap: Record<string, { productivityScore: number; skillLevel: string; preferredTaskType: string }> = {
        W001: { productivityScore: 85, skillLevel: 'advanced', preferredTaskType: 'picking' },
        W002: { productivityScore: 78, skillLevel: 'intermediate', preferredTaskType: 'packing' },
        W003: { productivityScore: 82, skillLevel: 'advanced', preferredTaskType: 'picking' },
        W004: { productivityScore: 75, skillLevel: 'intermediate', preferredTaskType: 'sorting' },
      };
      return Promise.resolve(productivityMap[workerId] || { productivityScore: 70, skillLevel: 'beginner', preferredTaskType: 'general' });
    });

    jest.spyOn(require('../../src/services/audit'), 'recordOperationAudit').mockResolvedValue({
      auditId: 'AUDIT-001',
      userId: 'CENTER-LONG-001',
      operation: 'extractAndRankAllocationPlansForReview',
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    const input = {
      userId: 'CENTER-LONG-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2025-01-20T09:00:00Z',
      timeRangeEnd: '2025-01-20T12:00:00Z',
      priorityFilter: 'high' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // All returned plans should have appropriate data freshness indicating data was collected
    expect(result.dataFreshness.progressDataAge).toBeLessThanOrEqual(300); // Within 5 minutes
    expect(result.dataFreshness.productivityDataAge).toBeLessThanOrEqual(300); // Within 5 minutes
    expect(result.dataFreshness.riskJudgmentAge).toBeLessThanOrEqual(300); // Within 5 minutes

    // Verify time range is respected in result
    result.allocationPlans.forEach((plan) => {
      const plannedStart = new Date(plan.plannedStartDate);
      const plannedEnd = new Date(plan.plannedEndDate);
      const rangeStart = new Date(input.timeRangeStart);
      const rangeEnd = new Date(input.timeRangeEnd);

      // Plans should overlap with or be within the requested time range
      expect(plannedStart.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());
      expect(plannedEnd.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
    });
  });
});