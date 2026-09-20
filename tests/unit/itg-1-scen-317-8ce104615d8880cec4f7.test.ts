import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

// Mock dependencies
const mockAuthorizeOperation = jest.fn();
const mockGetAllocationPlanById = jest.fn();
const mockGetRecentProgressDataByWorkInstruction = jest.fn();
const mockGetLatestProductivityDataByWorker = jest.fn();
const mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest.fn();
const mockValidateReferentialIntegrity = jest.fn();
const mockSaveAllocationPlan = jest.fn();
const mockRecordOperationAudit = jest.fn();
const mockGetApprovalCriteriaForFacility = jest.fn();

jest.mock('../../src/services/authorization-service', () => ({
  authorizeOperation: mockAuthorizeOperation,
}));

jest.mock('../../src/repositories/allocation-plan-repository', () => ({
  getAllocationPlanById: mockGetAllocationPlanById,
  saveAllocationPlan: mockSaveAllocationPlan,
}));

jest.mock('../../src/repositories/progress-data-repository', () => ({
  getRecentProgressDataByWorkInstruction: mockGetRecentProgressDataByWorkInstruction,
}));

jest.mock('../../src/repositories/productivity-data-repository', () => ({
  getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
}));

jest.mock('../../src/repositories/delay-risk-repository', () => ({
  getRecentDelayRiskJudgmentByFacilityAndTeam: mockGetRecentDelayRiskJudgmentByFacilityAndTeam,
}));

jest.mock('../../src/services/validation-service', () => ({
  validateReferentialIntegrity: mockValidateReferentialIntegrity,
}));

jest.mock('../../src/services/audit-service', () => ({
  recordOperationAudit: mockRecordOperationAudit,
}));

jest.mock('../../src/repositories/approval-criteria-repository', () => ({
  getApprovalCriteriaForFacility: mockGetApprovalCriteriaForFacility,
}));

describe('SCEN-317: 人員配置案の手動承認判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default stub implementations
    mockAuthorizeOperation.mockResolvedValue({
      hasPermission: true,
      role: 'center_long',
      facilityIds: ['facility-001'],
    });

    mockGetAllocationPlanById.mockResolvedValue({
      allocationPlanId: 'alloc-plan-12345',
      planName: 'Plan A',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerCount: 5,
      plannedStartDate: '2024-01-01T00:00:00Z',
      plannedEndDate: '2024-01-02T00:00:00Z',
      expectedCompletionDate: '2024-01-02T12:00:00Z',
      currentProgressRate: 85,
      delayRiskLevel: 'low',
      delayRiskScore: 20,
      predictedDelayDays: 0,
      feasibilityScore: 85,
      averageWorkerProductivityRate: 80,
      recommendationReason: 'Optimal allocation based on productivity',
      rankingPriority: 1,
      status: 'pending_review',
    });

    const now = new Date();
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);

    mockGetRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId: 'work-001',
      currentProgressRate: 85,
      plannedProgressRate: 80,
      dataAge: 3600,
      recordedAt: twentyThreeHoursAgo.toISOString(),
    });

    mockGetLatestProductivityDataByWorker.mockResolvedValue([
      {
        workerId: 'worker-001',
        productivityRate: 80,
        qualityScore: 90,
        dataAge: 1800,
        recordedAt: twentyThreeHoursAgo.toISOString(),
      },
      {
        workerId: 'worker-002',
        productivityRate: 82,
        qualityScore: 88,
        dataAge: 1800,
        recordedAt: twentyThreeHoursAgo.toISOString(),
      },
    ]);

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      riskLevel: 'low',
      predictedDelayDays: 0,
      dataAge: 7200,
      recordedAt: twentyThreeHoursAgo.toISOString(),
    });

    mockValidateReferentialIntegrity.mockResolvedValue({
      isValid: true,
      errors: [],
    });

    mockGetApprovalCriteriaForFacility.mockResolvedValue({
      minFeasibilityScore: 70,
      maxDelayRiskLevel: 'medium',
      minProductivityScore: 70,
      minProgressRate: 80,
      maxAllocationCapacityUtilization: 100,
    });

    mockSaveAllocationPlan.mockResolvedValue({
      success: true,
      allocationPlanId: 'alloc-plan-12345',
    });

    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-001',
      recordedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('手動判定がapproveのとき、手動承認され判定理由にはユーザーコメントが含まれる', async () => {
    const userId = 'user-center-long-001';
    const allocationPlanId = 'alloc-plan-12345';
    const manualDecisionReason =
      '人員配置案は現場の対応能力と照らし合わせて適切と判断します';

    const result = await judgeAllocationPlanApprovalWithCriteria({
      userId,
      allocationPlanId,
      manualDecision: 'approve',
      manualDecisionReason,
    });

    // Verify output structure and values
    expect(result.allocationPlanId).toBe('alloc-plan-12345');
    expect(result.approvalStatus).toBe('approved');
    expect(result.approvalDecisionType).toBe('manual_approved');
    expect(result.approvalReason).toBe(manualDecisionReason);
    expect(result.judgedBy).toBe('user-center-long-001');
    expect(result.judgedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Verify criteriaEvaluationResult exists and has required fields
    expect(result.criteriaEvaluationResult).toBeDefined();
    expect(result.criteriaEvaluationResult.progressRateThreshold).toBeDefined();
    expect(
      result.criteriaEvaluationResult.progressRateThreshold.threshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.progressRateThreshold.actualValue
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.progressRateThreshold.passed
    ).toBe(true);

    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold).toBeDefined();
    expect(
      result.criteriaEvaluationResult.delayRiskLevelThreshold.threshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.delayRiskLevelThreshold.actualValue
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.delayRiskLevelThreshold.passed
    ).toBe(true);

    expect(
      result.criteriaEvaluationResult.productivityScoreThreshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.productivityScoreThreshold.threshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.productivityScoreThreshold.actualValue
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.productivityScoreThreshold.passed
    ).toBe(true);

    expect(
      result.criteriaEvaluationResult.feasibilityScoreThreshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.feasibilityScoreThreshold.threshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.feasibilityScoreThreshold.actualValue
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.feasibilityScoreThreshold.passed
    ).toBe(true);

    expect(
      result.criteriaEvaluationResult.allocationCapacityThreshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.allocationCapacityThreshold.threshold
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.allocationCapacityThreshold.actualValue
    ).toBeDefined();
    expect(
      result.criteriaEvaluationResult.allocationCapacityThreshold.passed
    ).toBe(true);

    expect(result.criteriaEvaluationResult.overallPassed).toBe(true);

    // Verify authorization was checked
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      userId,
      'approve_allocation_plan'
    );

    // Verify allocation plan was retrieved
    expect(mockGetAllocationPlanById).toHaveBeenCalledWith(allocationPlanId);

    // Verify data retrieval calls
    expect(mockGetRecentProgressDataByWorkInstruction).toHaveBeenCalled();
    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalled();
    expect(mockGetRecentDelayRiskJudgmentByFacilityAndTeam).toHaveBeenCalled();

    // Verify approval criteria was retrieved
    expect(mockGetApprovalCriteriaForFacility).toHaveBeenCalled();

    // Verify referential integrity check
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith(
      allocationPlanId
    );

    // Verify saveAllocationPlan was called with approval status
    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId: 'alloc-plan-12345',
        status: 'approved',
      })
    );

    // Verify recordOperationAudit was called with correct parameters
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-center-long-001',
        operationType: 'manual_approval',
        targetId: allocationPlanId,
        reason: manualDecisionReason,
      })
    );
  });
});