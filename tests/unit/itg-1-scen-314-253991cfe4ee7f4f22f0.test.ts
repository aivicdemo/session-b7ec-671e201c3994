import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-314: 承認判定に必要なデータ不足時のエラーハンドリング', () => {
  let mockGetAllocationPlanById: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockGetRecentProgressDataByWorkInstruction: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllocationPlanById = jest.fn().mockResolvedValue({
      allocationPlanId: 'plan-001',
      planName: 'Test Plan',
      facilityId: '拠点-001',
      teamId: 'team-001',
      workInstructionId: 'instruction-001',
      allocatedWorkerCount: 5,
      plannedStartDate: '2024-01-01T00:00:00Z',
      plannedEndDate: '2024-01-02T00:00:00Z',
      expectedCompletionDate: '2024-01-02T00:00:00Z',
      currentProgressRate: 50,
      delayRiskLevel: 'medium',
      delayRiskScore: 45,
      predictedDelayDays: 1,
      feasibilityScore: 80,
      averageWorkerProductivityRate: 75,
      recommendationReason: 'Optimal allocation',
      rankingPriority: 1,
      status: 'pending_review',
    });

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    mockGetRecentProgressDataByWorkInstruction = jest.fn().mockResolvedValue(null);

    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue({
      workerId: 'worker-001',
      productivityRate: 75,
      qualityScore: 85,
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest.fn().mockResolvedValue({
      riskLevel: 'medium',
      predictedDelayDays: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('進捗データが不足している場合、InsufficientDataForJudgmentErrorが発生する', async () => {
    const input = {
      userId: 'user-center-001',
      allocationPlanId: 'plan-001',
      manualDecision: null as const,
      manualDecisionReason: null,
      approvalCriteria: {
        minFeasibilityScore: 70,
        maxDelayRiskLevel: 'high' as const,
        minProductivityScore: 60,
        minProgressRate: 50,
        maxAllocationCapacityUtilization: 80,
      },
    };

    const dependencies = {
      getAllocationPlanById: mockGetAllocationPlanById,
      authorizeOperation: mockAuthorizeOperation,
      getRecentProgressDataByWorkInstruction: mockGetRecentProgressDataByWorkInstruction,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
    };

    await expect(
      judgeAllocationPlanApprovalWithCriteria(input, dependencies)
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'InsufficientDataForJudgmentError',
        message: '判定に必要なデータが不足しています: progress_data',
      })
    );
  });
});