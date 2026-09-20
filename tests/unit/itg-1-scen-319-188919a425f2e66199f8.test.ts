import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-319: 手動判定がnullで基準外の配置案について、人による判定待ち状態を返す', () => {
  const userId = 'user-logistics-center-manager-001';
  const allocationPlanId = 'plan-out-of-criteria-001';
  const facilityId = 'facility-001';
  const teamId = 'team-001';
  const workInstructionId = 'work-instruction-001';

  let mockGetAllocationPlanById: jest.Mock;
  let mockGetRecentProgressDataByWorkInstruction: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllocationPlanById = jest.fn();
    mockGetRecentProgressDataByWorkInstruction = jest.fn();
    mockGetLatestProductivityDataByWorker = jest.fn();
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest.fn();
    mockAuthorizeOperation = jest.fn();
    mockValidateReferentialIntegrity = jest.fn();
    mockSaveAllocationPlan = jest.fn();
    mockRecordOperationAudit = jest.fn();

    (global as any).getAllocationPlanById = mockGetAllocationPlanById;
    (global as any).getRecentProgressDataByWorkInstruction = mockGetRecentProgressDataByWorkInstruction;
    (global as any).getLatestProductivityDataByWorker = mockGetLatestProductivityDataByWorker;
    (global as any).getRecentDelayRiskJudgmentByFacilityAndTeam = mockGetRecentDelayRiskJudgmentByFacilityAndTeam;
    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).validateReferentialIntegrity = mockValidateReferentialIntegrity;
    (global as any).saveAllocationPlan = mockSaveAllocationPlan;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
  });

  it('基準外の配置案でmanualDecisionがnullの場合、pending_manual_reviewを返す', async () => {
    const approvalCriteria = {
      minFeasibilityScore: 70,
      maxDelayRiskLevel: 'medium' as const,
      minProductivityScore: 70,
      minProgressRate: 80,
      maxAllocationCapacityUtilization: 85,
    };

    const maxFacilityCapacity = 100;
    const outOfCriteriaAllocationPlan = {
      allocationPlanId,
      planName: 'Configuration Plan Out of Criteria',
      facilityId,
      teamId,
      workInstructionId,
      allocatedWorkerCount: 95,
      plannedStartDate: '2024-01-15T08:00:00Z',
      plannedEndDate: '2024-01-20T18:00:00Z',
      expectedCompletionDate: '2024-01-21T00:00:00Z',
      currentProgressRate: 30,
      delayRiskLevel: 'high' as const,
      delayRiskScore: 75,
      predictedDelayDays: 5,
      feasibilityScore: 55,
      averageWorkerProductivityRate: 65,
      recommendationReason: 'High-risk allocation due to capacity constraints',
      rankingPriority: 2,
      status: 'pending_review' as const,
    };

    const progressData = {
      workInstructionId,
      currentProgressRate: 30,
      plannedProgressRate: 50,
    };

    const productivityDataMap: { [workerId: string]: { productivityRate: number; qualityScore: number } } = {
      'worker-001': { productivityRate: 65, qualityScore: 80 },
      'worker-002': { productivityRate: 65, qualityScore: 80 },
    };

    const delayRiskData = {
      riskLevel: 'high' as const,
      predictedDelayDays: 5,
    };

    mockGetAllocationPlanById.mockResolvedValue(outOfCriteriaAllocationPlan);
    mockGetRecentProgressDataByWorkInstruction.mockResolvedValue(progressData);
    mockGetLatestProductivityDataByWorker.mockImplementation((workerId: string) =>
      Promise.resolve(productivityDataMap[workerId] || { productivityRate: 65, qualityScore: 80 })
    );
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue(delayRiskData);
    mockAuthorizeOperation.mockResolvedValue(true);
    mockValidateReferentialIntegrity.mockResolvedValue(true);
    mockSaveAllocationPlan.mockResolvedValue({
      ...outOfCriteriaAllocationPlan,
      status: 'pending_review',
    });
    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-001',
      operationType: 'ALLOCATION_PLAN_REVIEW',
      userId,
      allocationPlanId,
      timestamp: new Date().toISOString(),
    });

    const input = {
      userId,
      allocationPlanId,
      manualDecision: null,
      manualDecisionReason: null,
    };

    const beforeTime = new Date();
    const result = await judgeAllocationPlanApprovalWithCriteria(input);
    const afterTime = new Date();

    expect(result.allocationPlanId).toBe(allocationPlanId);
    expect(result.approvalStatus).toBe('pending_manual_review');
    expect(result.approvalDecisionType).toBe('auto_rejected');

    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.actualValue).toBe(55);
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.threshold).toBe(70);

    expect(result.criteriaEvaluationResult.productivityScoreThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.actualValue).toBe(65);
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.threshold).toBe(70);

    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.actualValue).toBe('high');
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.threshold).toBe('medium');

    expect(result.criteriaEvaluationResult.progressRateThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.progressRateThreshold.actualValue).toBe(30);
    expect(result.criteriaEvaluationResult.progressRateThreshold.threshold).toBe(80);

    expect(result.criteriaEvaluationResult.allocationCapacityThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.allocationCapacityThreshold.actualValue).toBe(95);
    expect(result.criteriaEvaluationResult.allocationCapacityThreshold.threshold).toBe(85);

    expect(result.criteriaEvaluationResult.overallPassed).toBe(false);

    expect(result.approvalReason).toBeTruthy();
    expect(result.approvalReason.length).toBeGreaterThan(0);
    expect(result.approvalReason).toMatch(/実現可能性スコア.*55.*70/);
    expect(result.approvalReason).toMatch(/生産性.*65.*70/);
    expect(result.approvalReason).toMatch(/遅延リスク.*high.*medium/);
    expect(result.approvalReason).toMatch(/進捗率.*30.*80/);
    expect(result.approvalReason).toMatch(/配置人員.*95.*85/);

    expect(result.judgedBy).toBe(userId);
    
    const judgedAtDate = new Date(result.judgedAt);
    expect(judgedAtDate.getTime()).toBeGreaterThan(0);
    expect(judgedAtDate.toISOString()).toBe(result.judgedAt);
    expect(judgedAtDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
    expect(judgedAtDate.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);

    expect(mockGetAllocationPlanById).toHaveBeenCalledWith(allocationPlanId);
    expect(mockGetRecentProgressDataByWorkInstruction).toHaveBeenCalledWith(workInstructionId);
    expect(mockGetRecentDelayRiskJudgmentByFacilityAndTeam).toHaveBeenCalledWith(facilityId, teamId);
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(userId, facilityId);
    expect(mockValidateReferentialIntegrity).toHaveBeenCalled();
    
    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId,
        status: 'pending_review',
      })
    );
    
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        allocationPlanId,
        operationType: 'ALLOCATION_PLAN_REVIEW',
      })
    );
  });

  it('複数基準が不合格の場合、criteriaEvaluationResultに全て反映される', async () => {
    const allocationPlanId2 = 'plan-multi-criteria-fail-001';

    const multiFailAllocationPlan = {
      allocationPlanId: allocationPlanId2,
      planName: 'Multi-Fail Plan',
      facilityId,
      teamId,
      workInstructionId,
      allocatedWorkerCount: 95,
      plannedStartDate: '2024-01-15T08:00:00Z',
      plannedEndDate: '2024-01-20T18:00:00Z',
      expectedCompletionDate: '2024-01-21T00:00:00Z',
      currentProgressRate: 20,
      delayRiskLevel: 'critical' as const,
      delayRiskScore: 95,
      predictedDelayDays: 10,
      feasibilityScore: 40,
      averageWorkerProductivityRate: 50,
      recommendationReason: 'Critical risk allocation',
      rankingPriority: 1,
      status: 'pending_review' as const,
    };

    mockGetAllocationPlanById.mockResolvedValue(multiFailAllocationPlan);
    mockGetRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId,
      currentProgressRate: 20,
      plannedProgressRate: 60,
    });
    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      productivityRate: 50,
      qualityScore: 70,
    });
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      riskLevel: 'critical',
      predictedDelayDays: 10,
    });
    mockAuthorizeOperation.mockResolvedValue(true);
    mockValidateReferentialIntegrity.mockResolvedValue(true);
    mockSaveAllocationPlan.mockResolvedValue(multiFailAllocationPlan);
    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-002',
      operationType: 'ALLOCATION_PLAN_REVIEW',
      userId,
      allocationPlanId: allocationPlanId2,
      timestamp: new Date().toISOString(),
    });

    const input = {
      userId,
      allocationPlanId: allocationPlanId2,
      manualDecision: null,
      manualDecisionReason: null,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.approvalStatus).toBe('pending_manual_review');
    expect(result.approvalDecisionType).toBe('auto_rejected');

    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.actualValue).toBe(40);
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.threshold).toBe(70);
    
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.actualValue).toBe(50);
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.threshold).toBe(70);
    
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.actualValue).toBe('critical');
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.threshold).toBe('medium');
    
    expect(result.criteriaEvaluationResult.progressRateThreshold.passed).toBe(false);
    expect(result.criteriaEvaluationResult.progressRateThreshold.actualValue).toBe(20);
    expect(result.criteriaEvaluationResult.progressRateThreshold.threshold).toBe(80);
    
    expect(result.criteriaEvaluationResult.allocationCapacityThreshold.passed).toBe(false);

    expect(result.criteriaEvaluationResult.overallPassed).toBe(false);

    expect(result.judgedBy).toBe(userId);
    expect(result.judgedAt).toBeTruthy();
    const judgedAtDate = new Date(result.judgedAt);
    expect(judgedAtDate.toISOString()).toBe(result.judgedAt);

    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId: allocationPlanId2,
        status: 'pending_review',
      })
    );
    
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        allocationPlanId: allocationPlanId2,
        operationType: 'ALLOCATION_PLAN_REVIEW',
      })
    );
  });

  it('手動判定がnullで、基準外の場合、approvalReasonに詳細な理由が含まれる', async () => {
    const outOfCriteriaAllocationPlan = {
      allocationPlanId,
      planName: 'Configuration Plan Out of Criteria',
      facilityId,
      teamId,
      workInstructionId,
      allocatedWorkerCount: 90,
      plannedStartDate: '2024-01-15T08:00:00Z',
      plannedEndDate: '2024-01-20T18:00:00Z',
      expectedCompletionDate: '2024-01-21T00:00:00Z',
      currentProgressRate: 30,
      delayRiskLevel: 'high' as const,
      delayRiskScore: 75,
      predictedDelayDays: 5,
      feasibilityScore: 55,
      averageWorkerProductivityRate: 65,
      recommendationReason: 'High-risk allocation due to capacity constraints',
      rankingPriority: 2,
      status: 'pending_review' as const,
    };

    mockGetAllocationPlanById.mockResolvedValue(outOfCriteriaAllocationPlan);
    mockGetRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId,
      currentProgressRate: 30,
      plannedProgressRate: 50,
    });
    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      productivityRate: 65,
      qualityScore: 80,
    });
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      riskLevel: 'high',
      predictedDelayDays: 5,
    });
    mockAuthorizeOperation.mockResolvedValue(true);
    mockValidateReferentialIntegrity.mockResolvedValue(true);
    mockSaveAllocationPlan.mockResolvedValue(outOfCriteriaAllocationPlan);
    mockRecordOperationAudit.mockResolvedValue({
      auditId: 'audit-003',
      operationType: 'ALLOCATION_PLAN_REVIEW',
      userId,
      allocationPlanId,
      timestamp: new Date().toISOString(),
    });

    const input = {
      userId,
      allocationPlanId,
      manualDecision: null,
      manualDecisionReason: null,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.approvalReason).toBeTruthy();
    expect(result.approvalReason.length).toBeGreaterThan(0);
    expect(result.approvalReason).toMatch(/実現可能性スコア/);
    expect(result.approvalReason).toMatch(/生産性/);
    expect(result.approvalReason).toMatch(/遅延リスク/);
    expect(result.approvalReason).toMatch(/進捗率/);

    expect(result.approvalStatus).toBe('pending_manual_review');
    expect(result.approvalDecisionType).toBe('auto_rejected');

    expect(result.judgedBy).toBe(userId);
    expect(result.judgedAt).toBeTruthy();
    const judgedAtDate = new Date(result.judgedAt);
    expect(judgedAtDate.toISOString()).toBe(result.judgedAt);

    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationPlanId,
        status: 'pending_review',
      })
    );
    
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        allocationPlanId,
        operationType: 'ALLOCATION_PLAN_REVIEW',
      })
    );
  });
});