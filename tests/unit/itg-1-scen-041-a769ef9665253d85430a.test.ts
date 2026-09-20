import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-041: 処理完了後、operationAuditが呼び出されて監査ログが記録される', () => {
  let mockGetProductivityDataById: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetProductivityDataById = jest.fn();
    mockListProductivityDataByCondition = jest.fn();
    mockGetWorkerWithProficiencyAndProductivity = jest.fn();
    mockGenerateAllocationPlans = jest.fn();
    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn();
    mockSaveAllocationPlan = jest.fn();
    mockDeliverAllocationPlanAndWorkInstructions = jest.fn();
    mockAuthorizeOperation = jest.fn();
    mockRecordOperationAudit = jest.fn();
    mockValidateReferentialIntegrity = jest.fn();

    mockAuthorizeOperation.mockReturnValue({
      authorization_granted: true,
    });

    mockRecordOperationAudit.mockImplementation((auditData) => {
      return { auditId: 'AUDIT-001', ...auditData };
    });

    const productivityDataRecords = [
      {
        生産性データID: 'PROD-001',
        作業者ID: 'WORKER-001',
        作業日: new Date('2024-01-15'),
        計画作業時間: 480,
        実績作業時間: 450,
        完了件数: 100,
        生産性率: 95,
      },
      {
        生産性データID: 'PROD-002',
        作業者ID: 'WORKER-002',
        作業日: new Date('2024-01-15'),
        計画作業時間: 480,
        実績作業時間: 500,
        完了件数: 85,
        生産性率: 80,
      },
    ];

    mockListProductivityDataByCondition.mockReturnValue(productivityDataRecords);

    const allocationPlans = [
      {
        allocationPlanId: 'PLAN-001',
        planName: '案A',
        feasibilityScore: 85,
        recommendedRank: 1,
        status: 'proposed',
      },
      {
        allocationPlanId: 'PLAN-002',
        planName: '案B',
        feasibilityScore: 78,
        recommendedRank: 2,
        status: 'proposed',
      },
    ];

    mockGenerateAllocationPlans.mockReturnValue(allocationPlans);

    mockJudgeAllocationPlanApprovalWithCriteria.mockReturnValue({
      approvedPlans: [
        {
          allocationPlanId: 'PLAN-001',
          planName: '案A',
          approvalReason: '承認基準内',
          deliveryStatus: 'ready',
        },
      ],
      rejectedPlans: [
        {
          allocationPlanId: 'PLAN-002',
          planName: '案B',
          rejectionReason: '実現可能性スコアが基準以下',
        },
      ],
    });

    mockSaveAllocationPlan.mockReturnValue({
      allocationPlanId: 'PLAN-001',
      status: 'saved',
    });

    mockDeliverAllocationPlanAndWorkInstructions.mockReturnValue({
      deliveredInstructionCount: 5,
      failedDeliveryCount: 0,
      deliveryStatus: 'delivered',
    });

    mockValidateReferentialIntegrity.mockReturnValue({ valid: true });
  });

  it('処理完了後、recordOperationAudit が正確に1回呼び出され、監査ログが記録されること', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER123',
      autoApprovalEnabled: true,
    };

    const aiClient = {
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity:
        mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
    };

    const output = await runTx2Imp2Agent(input, aiClient);

    expect(output.status).toMatch(/^(success|partial_success)$/);

    expect(mockRecordOperationAudit).toHaveBeenCalledTimes(1);

    const auditCallArgs = mockRecordOperationAudit.mock.calls[0][0];

    expect(auditCallArgs.facilityId).toBe('FAC001');
    expect(auditCallArgs.executingUserId).toBe('USER123');
    expect(auditCallArgs.status).toMatch(/^(success|partial_success)$/);

    expect(auditCallArgs.details).toBeDefined();
    expect(auditCallArgs.details.analysisMetadata).toBeDefined();
    expect(auditCallArgs.details.analysisMetadata.productivityDataCount).toBeDefined();
    expect(auditCallArgs.details.analysisMetadata.workersAnalyzed).toBeDefined();
    expect(auditCallArgs.details.analysisMetadata.proficiencyLevelsApplied).toBeDefined();
    expect(auditCallArgs.details.analysisMetadata.analysisExecutionTimeMs).toBeDefined();

    expect(auditCallArgs.details.generatedAllocationPlansCount).toBeDefined();
    expect(auditCallArgs.details.autoApprovedPlansCount).toBeDefined();
    expect(auditCallArgs.details.deliveredInstructionCount).toBeDefined();
  });

  it('runTx2Imp2Agent が正常に完了し、Tx2Imp2AgentOutput を返すこと', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER123',
      autoApprovalEnabled: true,
    };

    const aiClient = {
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity:
        mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
    };

    const output = await runTx2Imp2Agent(input, aiClient);

    expect(output).toBeDefined();
    expect(output.status).toMatch(/^(success|partial_success|pending_approval|failed)$/);
    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.deliveredInstructionCount).toBeGreaterThanOrEqual(0);
    expect(output.failedDeliveryCount).toBeGreaterThanOrEqual(0);
    expect(output.analysisMetadata).toBeDefined();
    expect(output.analysisMetadata.productivityDataCount).toBeGreaterThanOrEqual(0);
    expect(output.analysisMetadata.workersAnalyzed).toBeGreaterThanOrEqual(0);
    expect(output.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('監査ログが recordOperationAudit 呼び出し後に決定不可逆的に記録されること', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER123',
      autoApprovalEnabled: true,
    };

    let auditWasCalled = false;

    mockRecordOperationAudit.mockImplementation((auditData) => {
      auditWasCalled = true;
      return { auditId: 'AUDIT-001', ...auditData };
    });

    const aiClient = {
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity:
        mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
    };

    const output = await runTx2Imp2Agent(input, aiClient);

    expect(output.status).toMatch(/^(success|partial_success)$/);
    expect(auditWasCalled).toBe(true);
  });
});