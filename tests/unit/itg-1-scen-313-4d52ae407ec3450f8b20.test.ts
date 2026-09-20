import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-313: 人員配置案のステータスがpending_review以外のとき、InvalidAllocationPlanStatusErrorが発生する', () => {
  const invalidStatuses = ['approved', 'rejected', 'in_progress'];
  const userId = 'user-logistics-center-001';
  const allocationPlanId = 'plan-001';

  invalidStatuses.forEach((status) => {
    it(`ステータスが '${status}' のとき、InvalidAllocationPlanStatusError を発生させる`, async () => {
      const mockAllocationPlan = {
        allocationPlanId,
        planName: 'Test Plan',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-01T00:00:00Z',
        plannedEndDate: '2024-01-02T00:00:00Z',
        expectedCompletionDate: '2024-01-03T00:00:00Z',
        currentProgressRate: 50,
        delayRiskLevel: 'medium' as const,
        delayRiskScore: 45,
        predictedDelayDays: 1,
        feasibilityScore: 75,
        averageWorkerProductivityRate: 80,
        recommendationReason: 'Optimal allocation',
        rankingPriority: 1,
        status: status as 'approved' | 'rejected' | 'in_progress',
      };

      const mockDependencies = {
        getAllocationPlanById: jest.fn().mockResolvedValue(mockAllocationPlan),
        authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
      };

      await expect(
        judgeAllocationPlanApprovalWithCriteria(
          {
            userId,
            allocationPlanId,
            manualDecision: null,
            manualDecisionReason: null,
          },
          mockDependencies as any
        )
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationPlanStatusError',
          message: expect.stringContaining(
            `人員配置案のステータスが無効です: 現在のステータス=${status}`
          ),
        })
      );
    });
  });
});