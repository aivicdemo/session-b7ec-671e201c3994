import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-066: 配置指示配信失敗時のエラーハンドリング', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      userId: 'user-001',
    });

    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      delayRiskJudgments: [
        {
          workInstructionId: 'wi-001',
          facilityId: 'facility-A',
          riskLevel: 'high',
          delayPredictionDays: 2,
          recommendedAction: 'staffing_adjustment',
        },
      ],
    });

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue({
      generatedAllocationPlans: [
        {
          allocationPlanId: 'plan-001',
          facilityId: 'facility-A',
          teamId: 'team-A',
          totalExpectedHours: 40,
          feasibilityScore: 85,
          workerAllocations: [
            {
              workerId: 'worker-001',
              workerName: 'Worker A',
              proficiencyLevel: 'intermediate',
              assignedWorkType: 'assembly',
              allocatedHours: 20,
              productivityRate: 75,
            },
          ],
        },
      ],
    });

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue({
        approvalResults: [
          {
            allocationPlanId: 'plan-001',
            approvalStatus: 'auto_approved',
            approvalReason: 'Within feasibility criteria',
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
        ],
      });

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockRejectedValue(
      new Error('DeliveryInstructionError: Failed to deliver allocation instructions'),
    );

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'audit-001',
      recorded: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('配置指示配信失敗時に executionStatus が failed となり、errorSummary にエラー文言が含まれること', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const result = await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.executionStatus).toBe('failed');
    expect(result.errorSummary).toContain(
      '配置指示の配信に失敗しました。通知システムを確認してください。'
    );
    expect(Array.isArray(result.deliveredInstructions)).toBe(true);
    expect(result.deliveredInstructions.length).toBeGreaterThanOrEqual(0);
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-001');
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
  });

  test('権限検証は成功し、AuthorizationError は発生しないこと', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const result = await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-001');
    expect(result.errorSummary).not.toContain('AuthorizationError');
  });

  test('配置指示配信前のリスク判定と承認判定は完了していること', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
  });

  test('配置指示配信前に複数の承認判定結果が生成されていること', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const result = await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.approvalResults).toBeDefined();
    expect(Array.isArray(result.approvalResults)).toBe(true);
    expect(result.approvalResults.length).toBeGreaterThan(0);
  });

  test('エラー発生時にも executionStatus フィールドが存在すること', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const result = await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result).toHaveProperty('executionStatus');
    expect(['completed', 'partial_completion', 'failed']).toContain(
      result.executionStatus
    );
  });

  test('エラー発生時に errorSummary が null ではなく文字列となること', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const result = await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.errorSummary).not.toBeNull();
    expect(typeof result.errorSummary).toBe('string');
  });
});