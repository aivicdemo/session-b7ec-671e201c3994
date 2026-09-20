import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-022: 生産性データから最適人員配置案を自動生成し、承認基準に基づいて判定・配信', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockValidateReferentialIntegrity = jest.fn().mockResolvedValue({ valid: true });
    mockListProductivityDataByCondition = jest.fn().mockResolvedValue({
      productivityDataCount: 150,
      workersAnalyzed: 25,
      proficiencyLevelsApplied: ['level-1', 'level-2', 'level-3'],
      data: []
    });
    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue([
      {
        workerId: 'W-001',
        proficiencyLevel: 'level-3',
        avgProductivity: 95
      },
      {
        workerId: 'W-002',
        proficiencyLevel: 'level-2',
        avgProductivity: 87
      },
      {
        workerId: 'W-003',
        proficiencyLevel: 'level-1',
        avgProductivity: 72
      }
    ]);
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'PLAN-001',
        planName: '最適配置案1',
        feasibilityScore: 92,
        recommendedRank: 1,
        status: 'generated'
      },
      {
        allocationPlanId: 'PLAN-002',
        planName: '最適配置案2',
        feasibilityScore: 87,
        recommendedRank: 2,
        status: 'generated'
      },
      {
        allocationPlanId: 'PLAN-003',
        planName: '配置案3',
        feasibilityScore: 78,
        recommendedRank: 3,
        status: 'generated'
      }
    ]);
    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue({
      approved: [
        {
          allocationPlanId: 'PLAN-001',
          planName: '最適配置案1',
          feasibilityScore: 92,
          approvalReason: '承認基準内(92>=承認基準値)'
        },
        {
          allocationPlanId: 'PLAN-002',
          planName: '最適配置案2',
          feasibilityScore: 87,
          approvalReason: '承認基準内(87>=承認基準値)'
        }
      ],
      rejected: [
        {
          allocationPlanId: 'PLAN-003',
          planName: '配置案3',
          feasibilityScore: 78,
          rejectionReason: '承認基準外(78<承認基準値)'
        }
      ]
    });
    mockSaveAllocationPlan = jest.fn().mockResolvedValue({ saved: true });
    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue({
      deliveredInstructionCount: 8,
      failedDeliveryCount: 0
    });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({ recorded: true });

    // Stub global dependencies
    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).validateReferentialIntegrity = mockValidateReferentialIntegrity;
    (global as any).listProductivityDataByCondition = mockListProductivityDataByCondition;
    (global as any).getWorkerWithProficiencyAndProductivity = mockGetWorkerWithProficiencyAndProductivity;
    (global as any).generateAllocationPlans = mockGenerateAllocationPlans;
    (global as any).judgeAllocationPlanApprovalWithCriteria = mockJudgeAllocationPlanApprovalWithCriteria;
    (global as any).saveAllocationPlan = mockSaveAllocationPlan;
    (global as any).deliverAllocationPlanAndWorkInstructions = mockDeliverAllocationPlanAndWorkInstructions;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
  });

  it('代表的な正常入力で、生産性データから配置案を生成し、承認基準内なら自動承認・配信、承認基準外なら承認待ち状態で返す', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-100',
      autoApprovalEnabled: true
    };

    const startTime = Date.now();
    const result: Tx2Imp2AgentOutput = await runTx2Imp2Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      validateReferentialIntegrity: mockValidateReferentialIntegrity,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit
    });
    const endTime = Date.now();

    expect(result.status).toBe('success');

    expect(result.generatedAllocationPlans).toHaveLength(3);
    expect(result.generatedAllocationPlans[0]).toMatchObject({
      allocationPlanId: 'PLAN-001',
      feasibilityScore: 92,
      recommendedRank: 1,
      status: 'generated'
    });
    expect(result.generatedAllocationPlans[1]).toMatchObject({
      allocationPlanId: 'PLAN-002',
      feasibilityScore: 87,
      recommendedRank: 2,
      status: 'generated'
    });
    expect(result.generatedAllocationPlans[2]).toMatchObject({
      allocationPlanId: 'PLAN-003',
      feasibilityScore: 78,
      recommendedRank: 3,
      status: 'generated'
    });

    expect(result.autoApprovedPlans).toHaveLength(2);
    expect(result.autoApprovedPlans[0]).toMatchObject({
      allocationPlanId: 'PLAN-001',
      planName: '最適配置案1',
      approvalReason: '承認基準内(92>=承認基準値)',
      deliveryStatus: 'delivered'
    });
    expect(result.autoApprovedPlans[1]).toMatchObject({
      allocationPlanId: 'PLAN-002',
      planName: '最適配置案2',
      approvalReason: '承認基準内(87>=承認基準値)',
      deliveryStatus: 'delivered'
    });

    expect(result.pendingApprovalPlans).toHaveLength(1);
    expect(result.pendingApprovalPlans[0]).toMatchObject({
      allocationPlanId: 'PLAN-003',
      planName: '配置案3',
      feasibilityScore: 78,
      recommendedRank: 3,
      rejectionReason: '承認基準外(78<承認基準値)'
    });

    expect(result.deliveredInstructionCount).toBe(8);
    expect(result.failedDeliveryCount).toBe(0);

    expect(result.analysisMetadata).toMatchObject({
      productivityDataCount: 150,
      workersAnalyzed: 25,
      proficiencyLevelsApplied: ['level-1', 'level-2', 'level-3']
    });
    expect(result.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThan(0);
    expect(result.analysisMetadata.analysisExecutionTimeMs).toBeLessThanOrEqual(endTime - startTime + 100);

    expect(result.errorDetails).toBeNull();

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USER-100');
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith('FAC-001');
    expect(mockListProductivityDataByCondition).toHaveBeenCalledWith(
      'FAC-001',
      null,
      '2024-01-01',
      '2024-01-31'
    );
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalledWith('FAC-001');
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalledTimes(2);
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalledWith('USER-100', 'success');
  });
});