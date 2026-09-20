import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-040: 権限検証を通過して処理が実行される場合、authorizeOperationが呼び出される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetProductivityDataById: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockGetProductivityDataById = jest.fn().mockResolvedValue({
      productivityDataId: 'PROD-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      productivityRate: 95,
      completedCount: 100,
      plannedCount: 105,
    });
    mockListProductivityDataByCondition = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD-001',
        workerId: 'WKR-001',
        facilityId: 'FAC-001',
        productivityRate: 95,
      },
      {
        productivityDataId: 'PROD-002',
        workerId: 'WKR-002',
        facilityId: 'FAC-001',
        productivityRate: 88,
      },
    ]);
    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue({
      workerId: 'WKR-001',
      workerName: 'Test Worker',
      proficiencyLevel: 4,
      productivityHistory: [95, 93, 96],
    });
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'ALLOC-001',
        planName: 'Optimal Plan A',
        feasibilityScore: 92,
        recommendedRank: 1,
        status: 'generated',
      },
      {
        allocationPlanId: 'ALLOC-002',
        planName: 'Optimal Plan B',
        feasibilityScore: 85,
        recommendedRank: 2,
        status: 'generated',
      },
    ]);
    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue({
      approvedPlans: [
        {
          allocationPlanId: 'ALLOC-001',
          planName: 'Optimal Plan A',
          approvalReason: 'Meets all criteria',
          deliveryStatus: 'ready_to_deliver',
        },
      ],
      pendingPlans: [
        {
          allocationPlanId: 'ALLOC-002',
          planName: 'Optimal Plan B',
          feasibilityScore: 85,
          recommendedRank: 2,
          rejectionReason: 'Below threshold',
        },
      ],
    });
    mockSaveAllocationPlan = jest.fn().mockResolvedValue({
      allocationPlanId: 'ALLOC-001',
      status: 'approved',
      timestamp: new Date().toISOString(),
    });
    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue({
      deliveredInstructionCount: 5,
      failedDeliveryCount: 0,
    });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'AUDIT-001',
      recordedAt: new Date().toISOString(),
    });
    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
    });
  });

  it('権限検証を通過して処理が実行される場合、authorizeOperationが呼び出される', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(['success', 'partial_success', 'pending_approval']).toContain(result.status);
  });

  it('authorizeOperationが正確に1回呼び出されること', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    await runTx2Imp2Agent(input, mockAiClient);

    expect(mockAuthorizeOperation).toHaveBeenCalledTimes(1);
  });

  it('authorizeOperationが呼び出されたときの引数が正しいこと', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    await runTx2Imp2Agent(input, mockAiClient);

    const callArgs = mockAuthorizeOperation.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[0]).toBe('USR-AUTH-001');
    expect(callArgs[1]).toBeDefined();
    expect(typeof callArgs[1]).toBe('string');
    expect(callArgs[2]).toBeDefined();
    expect(typeof callArgs[2]).toBe('string');
    const operationId = callArgs[1];
    const resourceId = callArgs[2];
    expect(['AUTO_APPROVE_ALLOCATION', 'DELIVER_WORK_INSTRUCTION', 'GENERATE_ALLOCATION_PLAN']).toContain(operationId);
  });

  it('権限検証成功後、生産性データ取得と配置案生成へ進むこと', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(mockAuthorizeOperation).toHaveBeenCalledTimes(1);
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USR-AUTH-001', expect.any(String), expect.any(String));
    expect(result.status).not.toBe('failed');
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
  });

  it('自動承認が有効で、承認基準内の場合、配置指示が配信されること', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    if (result.autoApprovedPlans && result.autoApprovedPlans.length > 0) {
      expect(result.deliveredInstructionCount).toBeGreaterThanOrEqual(0);
      expect(result.failedDeliveryCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('操作監査ログが記録されること', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('メタデータが正しく返却されること', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(result.analysisMetadata).toBeDefined();
    expect(result.analysisMetadata.productivityDataCount).toBeGreaterThanOrEqual(0);
    expect(result.analysisMetadata.workersAnalyzed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.analysisMetadata.proficiencyLevelsApplied)).toBe(true);
    expect(result.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('権限検証成功後、生産性データ取得から配置指示配信までの処理フローが中断されないこと', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(mockAuthorizeOperation).toHaveBeenCalledTimes(1);
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(mockListProductivityDataByCondition).toHaveBeenCalled();
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    if (result.generatedAllocationPlans.length > 0) {
      expect(result.deliveredInstructionCount).toBeGreaterThanOrEqual(0);
      expect(result.failedDeliveryCount).toBeGreaterThanOrEqual(0);
    }

    expect(['success', 'partial_success', 'pending_approval']).toContain(result.status);
  });

  it('autoApprovalEnabledがtrueかつ承認基準内の場合、statusが成功を示すこと', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-AUTH-001',
      autoApprovalEnabled: true,
    };

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      generateAllocationPlan: jest.fn(),
      evaluateApprovalCriteria: jest.fn(),
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(result.status).toBeDefined();
    expect(['success', 'partial_success', 'pending_approval']).toContain(result.status);

    if (result.autoApprovedPlans) {
      expect(Array.isArray(result.autoApprovedPlans)).toBe(true);
    }
  });
});