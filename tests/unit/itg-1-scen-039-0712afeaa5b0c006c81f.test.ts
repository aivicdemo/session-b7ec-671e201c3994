import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AiClient } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-039: Tx2Imp2Agent - executingUserIdが空文字列の場合', () => {
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

  const createMockAiClient = (): Tx2Imp2AiClient => ({
    getProductivityDataById: mockGetProductivityDataById,
    listProductivityDataByCondition: mockListProductivityDataByCondition,
    getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
    generateAllocationPlans: mockGenerateAllocationPlans,
    judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
    saveAllocationPlan: mockSaveAllocationPlan,
    deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    authorizeOperation: mockAuthorizeOperation,
    recordOperationAudit: mockRecordOperationAudit,
    validateReferentialIntegrity: mockValidateReferentialIntegrity,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      userId: 'U001',
    });

    mockGetProductivityDataById = jest.fn().mockResolvedValue({
      productivityDataId: 'PD001',
      workerId: 'W001',
      productivityRate: 100,
    });

    mockListProductivityDataByCondition = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PD001',
        workerId: 'W001',
        productivityRate: 100,
      },
    ]);

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue({
      workerId: 'W001',
      workerName: 'Worker A',
      proficiencyLevel: 3,
      currentProductivity: 95,
    });

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'AP001',
        planName: 'Plan A',
        feasibilityScore: 85,
        recommendedRank: 1,
        status: 'proposed',
      },
    ]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue({
      approved: true,
      reason: 'Within approval criteria',
      criteriaMatches: true,
    });

    mockSaveAllocationPlan = jest.fn().mockResolvedValue({
      allocationPlanId: 'AP001',
      status: 'approved',
    });

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue({
      deliveryStatus: 'delivered',
      recipientCount: 5,
      failureCount: 0,
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'AUDIT001',
      timestamp: new Date().toISOString(),
    });

    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
    });
  });

  it('should throw InvalidInputParameterError when executingUserId is empty string', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'F001',
      teamId: 'T001',
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: '',
      autoApprovalEnabled: true,
    };

    const aiClient = createMockAiClient();

    await expect(runTx2Imp2Agent(input, aiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidInputParameterError',
        message: '入力パラメータが不正です。',
      })
    );

    expect(mockAuthorizeOperation).not.toHaveBeenCalled();
    expect(mockGetProductivityDataById).not.toHaveBeenCalled();
    expect(mockListProductivityDataByCondition).not.toHaveBeenCalled();
    expect(mockGetWorkerWithProficiencyAndProductivity).not.toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();
    expect(mockSaveAllocationPlan).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();
    expect(mockRecordOperationAudit).not.toHaveBeenCalled();
    expect(mockValidateReferentialIntegrity).not.toHaveBeenCalled();
  });
});