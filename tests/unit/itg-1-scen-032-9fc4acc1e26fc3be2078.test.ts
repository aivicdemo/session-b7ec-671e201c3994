import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-032: 複数の配置案が生成された場合、推奨順位に基づいて並べられて返される', () => {
  let mockGenerateAllocationPlans: jest.Mock;
  let mockGetProductivityDataById: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'PLAN-001',
        planName: 'チームA増員案',
        feasibilityScore: 92,
      },
      {
        allocationPlanId: 'PLAN-002',
        planName: 'チームB増員案',
        feasibilityScore: 85,
      },
      {
        allocationPlanId: 'PLAN-003',
        planName: 'チームC増員案',
        feasibilityScore: 78,
      },
    ]);

    mockGetProductivityDataById = jest.fn().mockResolvedValue({
      productivityDataId: 'PROD-001',
      workerId: 'WORKER-001',
      productivityRate: 95,
      qualityScore: 85,
    });

    mockListProductivityDataByCondition = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD-001',
        workerId: 'WORKER-001',
        productivityRate: 95,
        qualityScore: 85,
      },
    ]);

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue({
      workerId: 'WORKER-001',
      workerName: 'テスト作業者',
      proficiencyLevel: 4,
      averageProductivity: 90,
    });

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue({
      isApproved: true,
      approvalReason: '承認基準内',
      feasibilityScore: 92,
    });

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: 'USER-123',
    });
  });

  it('複数の配置案が推奨順位でソートされて返される', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-123',
      autoApprovalEnabled: true,
    };

    const output = await runTx2Imp2Agent(input, {
      generateAllocationPlans: mockGenerateAllocationPlans,
      getProductivityDataById: mockGetProductivityDataById,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      authorizeOperation: mockAuthorizeOperation,
    });

    expect(output).toBeDefined();
    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBe(3);

    // 各配置案が推奨順位を持つことを確認
    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('recommendedRank');
      expect(plan).toHaveProperty('status');
    });

    // recommendedRank が1から3の連番であることを確認
    expect(output.generatedAllocationPlans[0].recommendedRank).toBe(1);
    expect(output.generatedAllocationPlans[1].recommendedRank).toBe(2);
    expect(output.generatedAllocationPlans[2].recommendedRank).toBe(3);

    // recommendedRank=1 の案の詳細を確認
    expect(output.generatedAllocationPlans[0].allocationPlanId).toBe('PLAN-001');
    expect(output.generatedAllocationPlans[0].planName).toBe('チームA増員案');
    expect(output.generatedAllocationPlans[0].feasibilityScore).toBe(92);

    // recommendedRank=2 の案の詳細を確認
    expect(output.generatedAllocationPlans[1].allocationPlanId).toBe('PLAN-002');
    expect(output.generatedAllocationPlans[1].planName).toBe('チームB増員案');
    expect(output.generatedAllocationPlans[1].feasibilityScore).toBe(85);

    // recommendedRank=3 の案の詳細を確認
    expect(output.generatedAllocationPlans[2].allocationPlanId).toBe('PLAN-003');
    expect(output.generatedAllocationPlans[2].planName).toBe('チームC増員案');
    expect(output.generatedAllocationPlans[2].feasibilityScore).toBe(78);

    // 配列の並び順が recommendedRank の昇順で整列されていることを確認
    for (let i = 0; i < output.generatedAllocationPlans.length - 1; i++) {
      expect(output.generatedAllocationPlans[i].recommendedRank)
        .toBeLessThan(output.generatedAllocationPlans[i + 1].recommendedRank);
    }

    // status フィールドが有効な値を持つことを確認
    output.generatedAllocationPlans.forEach((plan) => {
      expect(['pending_approval', 'auto_approved', 'pending_review']).toContain(plan.status);
    });
  });
});