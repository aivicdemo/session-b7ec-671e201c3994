import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-2-imp-2/services/authorization');
jest.mock('../../src/agents/tx-2-imp-2/services/productivity-data');
jest.mock('../../src/agents/tx-2-imp-2/services/worker-service');
jest.mock('../../src/agents/tx-2-imp-2/services/allocation-plan-generator');
jest.mock('../../src/agents/tx-2-imp-2/services/approval-judge');
jest.mock('../../src/agents/tx-2-imp-2/services/delivery-service');

import * as authorizationModule from '../../src/agents/tx-2-imp-2/services/authorization';
import * as productivityDataModule from '../../src/agents/tx-2-imp-2/services/productivity-data';
import * as workerServiceModule from '../../src/agents/tx-2-imp-2/services/worker-service';
import * as allocationPlanGeneratorModule from '../../src/agents/tx-2-imp-2/services/allocation-plan-generator';
import * as approvalJudgeModule from '../../src/agents/tx-2-imp-2/services/approval-judge';
import * as deliveryServiceModule from '../../src/agents/tx-2-imp-2/services/delivery-service';

describe('SCEN-029: autoApprovalEnabledがfalseの場合、全ての配置案が承認待ち状態で返される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListProductivityData: jest.Mock;
  let mockGetWorkerWithProficiency: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeApprovalCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup authorization mock
    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    (authorizationModule.authorizeOperation as jest.Mock) = mockAuthorizeOperation;

    // Setup productivity data mock - returns 5 records
    mockListProductivityData = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PROD001',
        workerId: 'WKR001',
        workDate: '2024-01-15',
        completedCount: 50,
        productivityRate: 85,
        qualityScore: 90,
      },
      {
        productivityDataId: 'PROD002',
        workerId: 'WKR002',
        workDate: '2024-01-15',
        completedCount: 45,
        productivityRate: 80,
        qualityScore: 88,
      },
      {
        productivityDataId: 'PROD003',
        workerId: 'WKR001',
        workDate: '2024-01-16',
        completedCount: 52,
        productivityRate: 87,
        qualityScore: 92,
      },
      {
        productivityDataId: 'PROD004',
        workerId: 'WKR003',
        workDate: '2024-01-16',
        completedCount: 40,
        productivityRate: 75,
        qualityScore: 85,
      },
      {
        productivityDataId: 'PROD005',
        workerId: 'WKR002',
        workDate: '2024-01-17',
        completedCount: 48,
        productivityRate: 82,
        qualityScore: 89,
      },
    ]);
    (productivityDataModule.listProductivityDataByCondition as jest.Mock) = mockListProductivityData;

    // Setup worker service mock - returns 3 workers with proficiency
    mockGetWorkerWithProficiency = jest.fn().mockResolvedValue([
      {
        workerId: 'WKR001',
        workerName: 'Worker One',
        proficiencyLevel: 4,
        recentProductivityRate: 86,
      },
      {
        workerId: 'WKR002',
        workerName: 'Worker Two',
        proficiencyLevel: 3,
        recentProductivityRate: 81,
      },
      {
        workerId: 'WKR003',
        workerName: 'Worker Three',
        proficiencyLevel: 2,
        recentProductivityRate: 75,
      },
    ]);
    (workerServiceModule.getWorkerWithProficiencyAndProductivity as jest.Mock) = mockGetWorkerWithProficiency;

    // Setup allocation plan generator mock - returns 3 plans
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'PLAN001',
        planName: 'Allocation Plan A',
        feasibilityScore: 88,
        recommendedRank: 1,
        status: 'pending',
      },
      {
        allocationPlanId: 'PLAN002',
        planName: 'Allocation Plan B',
        feasibilityScore: 82,
        recommendedRank: 2,
        status: 'pending',
      },
      {
        allocationPlanId: 'PLAN003',
        planName: 'Allocation Plan C',
        feasibilityScore: 75,
        recommendedRank: 3,
        status: 'pending',
      },
    ]);
    (allocationPlanGeneratorModule.generateAllocationPlans as jest.Mock) = mockGenerateAllocationPlans;

    // Setup approval judge mock
    // 2 plans within criteria (PLAN001, PLAN002), 1 plan outside criteria (PLAN003)
    mockJudgeApprovalCriteria = jest.fn().mockImplementation((plan) => {
      if (plan.allocationPlanId === 'PLAN001' || plan.allocationPlanId === 'PLAN002') {
        return Promise.resolve({ isWithinCriteria: true, rejectionReason: null });
      }
      return Promise.resolve({
        isWithinCriteria: false,
        rejectionReason: 'Feasibility score below minimum threshold',
      });
    });
    (approvalJudgeModule.judgeAllocationPlanApprovalWithCriteria as jest.Mock) = mockJudgeApprovalCriteria;

    // Setup delivery service mock
    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue({
        deliveredCount: 0,
        failedCount: 0,
      });
    (deliveryServiceModule.deliverAllocationPlanAndWorkInstructions as jest.Mock) = mockDeliverAllocationPlanAndWorkInstructions;
  });

  it('autoApprovalEnabled=falseの場合、status="pending_approval"、全配置案が承認待ち状態で返される', async () => {
    // Prepare input
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER001',
      autoApprovalEnabled: false,
    };

    // Execute
    const result: Tx2Imp2AgentOutput = await runTx2Imp2Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProductivityData: mockListProductivityData,
      getWorkerWithProficiency: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeApprovalCriteria: mockJudgeApprovalCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    });

    // Assert status is pending_approval
    expect(result.status).toBe('pending_approval');

    // Assert generatedAllocationPlans contains all 3 plans
    expect(result.generatedAllocationPlans).toHaveLength(3);
    expect(result.generatedAllocationPlans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allocationPlanId: 'PLAN001',
          planName: 'Allocation Plan A',
          feasibilityScore: 88,
          recommendedRank: 1,
          status: 'pending',
        }),
        expect.objectContaining({
          allocationPlanId: 'PLAN002',
          planName: 'Allocation Plan B',
          feasibilityScore: 82,
          recommendedRank: 2,
          status: 'pending',
        }),
        expect.objectContaining({
          allocationPlanId: 'PLAN003',
          planName: 'Allocation Plan C',
          feasibilityScore: 75,
          recommendedRank: 3,
          status: 'pending',
        }),
      ])
    );

    // Assert autoApprovedPlans does not exist or is empty
    expect(result.autoApprovedPlans).toBeUndefined();

    // Assert pendingApprovalPlans contains all 3 plans
    expect(result.pendingApprovalPlans).toBeDefined();
    expect(result.pendingApprovalPlans).toHaveLength(3);

    // Verify all plans in pendingApprovalPlans
    const pendingPlans = result.pendingApprovalPlans as Array<{
      allocationPlanId: string;
      planName: string;
      feasibilityScore: number;
      recommendedRank: number;
      rejectionReason: string | null;
    }>;

    expect(pendingPlans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allocationPlanId: 'PLAN001',
          planName: 'Allocation Plan A',
          feasibilityScore: 88,
          recommendedRank: 1,
          rejectionReason: null,
        }),
        expect.objectContaining({
          allocationPlanId: 'PLAN002',
          planName: 'Allocation Plan B',
          feasibilityScore: 82,
          recommendedRank: 2,
          rejectionReason: null,
        }),
        expect.objectContaining({
          allocationPlanId: 'PLAN003',
          planName: 'Allocation Plan C',
          feasibilityScore: 75,
          recommendedRank: 3,
          rejectionReason: 'Feasibility score below minimum threshold',
        }),
      ])
    );

    // Assert deliveredInstructionCount is 0 (no delivery when autoApprovalEnabled=false)
    expect(result.deliveredInstructionCount).toBe(0);

    // Assert failedDeliveryCount is 0
    expect(result.failedDeliveryCount).toBe(0);

    // Verify delivery service was NOT called
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    // Verify metadata
    expect(result.analysisMetadata).toBeDefined();
    expect(result.analysisMetadata.productivityDataCount).toBeGreaterThan(0);
    expect(result.analysisMetadata.workersAnalyzed).toBeGreaterThan(0);
  });

  it('pendingApprovalPlans内の各案に正確なrejectReasonが含まれている', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER001',
      autoApprovalEnabled: false,
    };

    const result: Tx2Imp2AgentOutput = await runTx2Imp2Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProductivityData: mockListProductivityData,
      getWorkerWithProficiency: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeApprovalCriteria: mockJudgeApprovalCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    });

    const pendingPlans = result.pendingApprovalPlans as Array<{
      allocationPlanId: string;
      rejectionReason: string | null;
    }>;

    // Find plans by ID and verify rejection reasons
    const plan001 = pendingPlans.find((p) => p.allocationPlanId === 'PLAN001');
    const plan002 = pendingPlans.find((p) => p.allocationPlanId === 'PLAN002');
    const plan003 = pendingPlans.find((p) => p.allocationPlanId === 'PLAN003');

    expect(plan001?.rejectionReason).toBeNull();
    expect(plan002?.rejectionReason).toBeNull();
    expect(plan003?.rejectionReason).toBe('Feasibility score below minimum threshold');
  });

  it('autoApprovalEnabled=falseの場合、全配置案がstatus="pending"で返される', async () => {
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER001',
      autoApprovalEnabled: false,
    };

    const result: Tx2Imp2AgentOutput = await runTx2Imp2Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      listProductivityData: mockListProductivityData,
      getWorkerWithProficiency: mockGetWorkerWithProficiency,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeApprovalCriteria: mockJudgeApprovalCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    });

    // All plans should have status='pending'
    result.generatedAllocationPlans.forEach((plan) => {
      expect(plan.status).toBe('pending');
    });
  });
});