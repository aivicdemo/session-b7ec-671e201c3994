import { jest } from '@jest/globals';
import * as allocationPlanModule from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-293: 優先度スコアが50未満の配置案はリスクレベル「high」に分類される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should classify allocation plans with priorityScore < 50 as risk level "high", >= 50 && < 75 as "medium", and >= 75 as "low"', async () => {
    const userId = 'user-logistics-center-123';
    const targetFacilityIds = ['facility-001', 'facility-002'];
    const timeRangeStart = '2024-01-01T00:00:00Z';
    const timeRangeEnd = '2024-01-31T23:59:59Z';
    const priorityFilter = 'all';
    const maxResultCount = 50;

    // Mock authorizeOperation
    jest.spyOn(allocationPlanModule, 'authorizeOperation' as any).mockResolvedValue(true);

    // Mock validateDateTimeRange
    jest.spyOn(allocationPlanModule, 'validateDateTimeRange' as any).mockResolvedValue(true);

    // Mock listAllocationPlansByCondition with test data
    const mockAllocationPlans = [
      {
        allocationPlanId: 'plan-001',
        planName: 'Plan High Risk',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-01T08:00:00Z',
        plannedEndDate: '2024-01-01T17:00:00Z',
        expectedCompletionDate: '2024-01-02T17:00:00Z',
        currentProgressRate: 30,
        delayRiskLevel: 'high',
        delayRiskScore: 45,
        predictedDelayDays: 2,
        feasibilityScore: 60,
        averageWorkerProductivityRate: 75,
        recommendationReason: 'High delay risk',
        rankingPriority: 1,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-002',
        planName: 'Plan Medium Risk',
        facilityId: 'facility-001',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 3,
        plannedStartDate: '2024-01-01T08:00:00Z',
        plannedEndDate: '2024-01-01T17:00:00Z',
        expectedCompletionDate: '2024-01-02T17:00:00Z',
        currentProgressRate: 50,
        delayRiskLevel: 'medium',
        delayRiskScore: 50,
        predictedDelayDays: 1,
        feasibilityScore: 70,
        averageWorkerProductivityRate: 80,
        recommendationReason: 'Medium delay risk',
        rankingPriority: 2,
        status: 'pending_review' as const,
      },
      {
        allocationPlanId: 'plan-003',
        planName: 'Plan Low Risk',
        facilityId: 'facility-002',
        teamId: 'team-003',
        workInstructionId: 'work-003',
        allocatedWorkerCount: 2,
        plannedStartDate: '2024-01-01T08:00:00Z',
        plannedEndDate: '2024-01-01T17:00:00Z',
        expectedCompletionDate: '2024-01-02T17:00:00Z',
        currentProgressRate: 80,
        delayRiskLevel: 'low',
        delayRiskScore: 75,
        predictedDelayDays: 0,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 90,
        recommendationReason: 'Low delay risk',
        rankingPriority: 3,
        status: 'pending_review' as const,
      },
    ];

    jest.spyOn(allocationPlanModule, 'listAllocationPlansByCondition' as any).mockResolvedValue(mockAllocationPlans);

    // Mock getRecentDelayRiskJudgmentByFacilityAndTeam
    jest.spyOn(allocationPlanModule, 'getRecentDelayRiskJudgmentByFacilityAndTeam' as any).mockResolvedValue({
      'facility-001_team-001': { riskLevel: 'high', predictedDelayDays: 2 },
      'facility-001_team-002': { riskLevel: 'medium', predictedDelayDays: 1 },
      'facility-002_team-003': { riskLevel: 'low', predictedDelayDays: 0 },
    });

    // Mock getLatestProductivityDataByWorker
    jest.spyOn(allocationPlanModule, 'getLatestProductivityDataByWorker' as any).mockResolvedValue({
      'worker-001': { productivityRate: 75, qualityScore: 80 },
      'worker-002': { productivityRate: 80, qualityScore: 85 },
      'worker-003': { productivityRate: 90, qualityScore: 95 },
    });

    // Mock recordOperationAudit
    jest.spyOn(allocationPlanModule, 'recordOperationAudit' as any).mockResolvedValue({
      auditId: 'audit-123',
      timestamp: new Date().toISOString(),
    });

    const result = await allocationPlanModule.extractAndRankAllocationPlansForReview({
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
    });

    // Verify the output structure
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.analysisCompletedAt).toBeDefined();
    expect(typeof result.analysisCompletedAt).toBe('string');
    expect(result.dataFreshness).toBeDefined();
    expect(result.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(result.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);

    // Verify the business rule br-tx_2-004 based on delayRiskScore (priorityScore)
    // The business rule: riskLevel = priorityScore >= 75 ? "low" : priorityScore >= 50 ? "medium" : "high"
    result.allocationPlans.forEach((plan) => {
      const priorityScore = plan.delayRiskScore;

      if (priorityScore < 50) {
        expect(plan.delayRiskLevel).toBe('high');
      } else if (priorityScore >= 50 && priorityScore < 75) {
        expect(plan.delayRiskLevel).toBe('medium');
      } else if (priorityScore >= 75) {
        expect(plan.delayRiskLevel).toBe('low');
      }
    });

    // Verify boundary condition: priorityScore < 50 should be classified as "high"
    const highRiskPlans = result.allocationPlans.filter(
      (plan) => plan.delayRiskScore < 50,
    );
    highRiskPlans.forEach((plan) => {
      expect(plan.delayRiskLevel).toBe('high');
    });

    // Verify boundary condition: 50 <= priorityScore < 75 should be classified as "medium"
    const mediumRiskPlans = result.allocationPlans.filter(
      (plan) => plan.delayRiskScore >= 50 && plan.delayRiskScore < 75,
    );
    mediumRiskPlans.forEach((plan) => {
      expect(plan.delayRiskLevel).toBe('medium');
    });

    // Verify boundary condition: priorityScore >= 75 should be classified as "low"
    const lowRiskPlans = result.allocationPlans.filter(
      (plan) => plan.delayRiskScore >= 75,
    );
    lowRiskPlans.forEach((plan) => {
      expect(plan.delayRiskLevel).toBe('low');
    });
  });
});