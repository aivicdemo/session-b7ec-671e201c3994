import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

// Mock external dependencies only
jest.mock('../../src/services/authorization.service', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/services/data-validation.service', () => ({
  validateReferentialIntegrity: jest.fn(),
}));

jest.mock('../../src/repositories/productivity-data.repository', () => ({
  listProductivityDataByCondition: jest.fn(),
}));

jest.mock('../../src/repositories/worker.repository', () => ({
  getWorkerWithProficiencyAndProductivity: jest.fn(),
}));

jest.mock('../../src/services/allocation-plan.service', () => ({
  generateAllocationPlans: jest.fn(),
  judgeAllocationPlanApprovalWithCriteria: jest.fn(),
  saveAllocationPlan: jest.fn(),
  deliverAllocationPlanAndWorkInstructions: jest.fn(),
}));

jest.mock('../../src/services/audit.service', () => ({
  recordOperationAudit: jest.fn(),
}));

import { authorizeOperation } from '../../src/services/authorization.service';
import { validateReferentialIntegrity } from '../../src/services/data-validation.service';
import { listProductivityDataByCondition } from '../../src/repositories/productivity-data.repository';
import { getWorkerWithProficiencyAndProductivity } from '../../src/repositories/worker.repository';
import {
  generateAllocationPlans,
  judgeAllocationPlanApprovalWithCriteria,
  saveAllocationPlan,
  deliverAllocationPlanAndWorkInstructions,
} from '../../src/services/allocation-plan.service';
import { recordOperationAudit } from '../../src/services/audit.service';

describe('SCEN-033: 配置案の一部が自動承認され一部が基準外となった場合、statusが\'partial_success\'で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return partial_success status with mixed auto-approved and pending approval plans', async () => {
    // Setup test input
    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USR-ADMIN-001',
      autoApprovalEnabled: true,
    };

    // Setup approval criteria: feasibilityScore >= 80 is auto-approved
    const approvalCriteria = {
      feasibilityScoreThreshold: 80,
    };

    // Mock authorizeOperation - permission check passes
    (authorizeOperation as jest.Mock).mockResolvedValueOnce({
      authorized: true,
    });

    // Mock validateReferentialIntegrity - validation passes
    (validateReferentialIntegrity as jest.Mock).mockResolvedValueOnce({
      valid: true,
    });

    // Mock listProductivityDataByCondition - return 150 productivity data records
    (listProductivityDataByCondition as jest.Mock).mockResolvedValueOnce({
      records: Array(150).fill({
        productivityDataId: 'PD-001',
        workerId: 'WKR-001',
        date: '2024-01-15',
        completedItems: 100,
        workingMinutes: 480,
      }),
      count: 150,
    });

    // Mock getWorkerWithProficiencyAndProductivity - return 25 workers with proficiency levels
    const mockWorkers = [
      ...Array(10).fill({
        workerId: 'WKR-001',
        proficiencyLevel: '初級',
        productivityRate: 75,
      }),
      ...Array(10).fill({
        workerId: 'WKR-002',
        proficiencyLevel: '中級',
        productivityRate: 90,
      }),
      ...Array(5).fill({
        workerId: 'WKR-003',
        proficiencyLevel: '上級',
        productivityRate: 110,
      }),
    ];
    (getWorkerWithProficiencyAndProductivity as jest.Mock).mockResolvedValueOnce(
      mockWorkers
    );

    // Mock generateAllocationPlans - return 3 allocation plans
    const generatedPlans = [
      {
        allocationPlanId: 'PLAN-001',
        planName: 'チームA補強案',
        feasibilityScore: 85.5,
        recommendedRank: 1,
      },
      {
        allocationPlanId: 'PLAN-002',
        planName: 'チームB最適化案',
        feasibilityScore: 78.0,
        recommendedRank: 2,
      },
      {
        allocationPlanId: 'PLAN-003',
        planName: '全体人員融通案',
        feasibilityScore: 88.2,
        recommendedRank: 3,
      },
    ];
    (generateAllocationPlans as jest.Mock).mockResolvedValueOnce(generatedPlans);

    // Mock judgeAllocationPlanApprovalWithCriteria - apply approval criteria
    (judgeAllocationPlanApprovalWithCriteria as jest.Mock)
      .mockResolvedValueOnce({
        allocationPlanId: 'PLAN-001',
        status: 'approved',
        reason: '基準値（80.0）以上の実現可能性スコア',
      })
      .mockResolvedValueOnce({
        allocationPlanId: 'PLAN-002',
        status: 'pending_approval',
        reason: '基準値（80.0）未満のため承認保留',
      })
      .mockResolvedValueOnce({
        allocationPlanId: 'PLAN-003',
        status: 'approved',
        reason: '基準値（80.0）以上の実現可能性スコア',
      });

    // Mock saveAllocationPlan - save all 3 plans successfully
    (saveAllocationPlan as jest.Mock)
      .mockResolvedValueOnce({ allocationPlanId: 'PLAN-001', saved: true })
      .mockResolvedValueOnce({ allocationPlanId: 'PLAN-002', saved: true })
      .mockResolvedValueOnce({ allocationPlanId: 'PLAN-003', saved: true });

    // Mock deliverAllocationPlanAndWorkInstructions - deliver auto-approved plans
    (deliverAllocationPlanAndWorkInstructions as jest.Mock).mockResolvedValueOnce({
      deliveredPlans: [
        {
          allocationPlanId: 'PLAN-001',
          deliveryStatus: 'delivered',
        },
        {
          allocationPlanId: 'PLAN-003',
          deliveryStatus: 'delivered',
        },
      ],
      deliveredInstructionCount: 2,
      failedDeliveryCount: 0,
    });

    // Mock recordOperationAudit - log the operation
    (recordOperationAudit as jest.Mock).mockResolvedValueOnce({
      recorded: true,
    });

    // Execute
    const result = await runTx2Imp2Agent(input, {} as any);

    // Verify status is partial_success
    expect(result.status).toBe('partial_success');

    // Verify generatedAllocationPlans contains all 3 plans
    expect(result.generatedAllocationPlans).toHaveLength(3);
    expect(result.generatedAllocationPlans[0].allocationPlanId).toBe('PLAN-001');
    expect(result.generatedAllocationPlans[0].planName).toBe('チームA補強案');
    expect(result.generatedAllocationPlans[0].feasibilityScore).toBe(85.5);
    expect(result.generatedAllocationPlans[0].recommendedRank).toBe(1);
    expect(result.generatedAllocationPlans[0].status).toBe('approved');

    expect(result.generatedAllocationPlans[1].allocationPlanId).toBe('PLAN-002');
    expect(result.generatedAllocationPlans[1].planName).toBe('チームB最適化案');
    expect(result.generatedAllocationPlans[1].feasibilityScore).toBe(78.0);
    expect(result.generatedAllocationPlans[1].recommendedRank).toBe(2);
    expect(result.generatedAllocationPlans[1].status).toBe('pending_approval');

    expect(result.generatedAllocationPlans[2].allocationPlanId).toBe('PLAN-003');
    expect(result.generatedAllocationPlans[2].planName).toBe('全体人員融通案');
    expect(result.generatedAllocationPlans[2].feasibilityScore).toBe(88.2);
    expect(result.generatedAllocationPlans[2].recommendedRank).toBe(3);
    expect(result.generatedAllocationPlans[2].status).toBe('approved');

    // Verify autoApprovedPlans contains 2 approved plans
    expect(result.autoApprovedPlans).toHaveLength(2);
    expect(result.autoApprovedPlans?.[0].allocationPlanId).toBe('PLAN-001');
    expect(result.autoApprovedPlans?.[0].planName).toBe('チームA補強案');
    expect(result.autoApprovedPlans?.[0].approvalReason).toContain('基準値（80.0）以上');
    expect(result.autoApprovedPlans?.[0].deliveryStatus).toBe('delivered');

    expect(result.autoApprovedPlans?.[1].allocationPlanId).toBe('PLAN-003');
    expect(result.autoApprovedPlans?.[1].planName).toBe('全体人員融通案');
    expect(result.autoApprovedPlans?.[1].approvalReason).toContain('基準値（80.0）以上');
    expect(result.autoApprovedPlans?.[1].deliveryStatus).toBe('delivered');

    // Verify pendingApprovalPlans contains 1 pending plan
    expect(result.pendingApprovalPlans).toHaveLength(1);
    expect(result.pendingApprovalPlans?.[0].allocationPlanId).toBe('PLAN-002');
    expect(result.pendingApprovalPlans?.[0].planName).toBe('チームB最適化案');
    expect(result.pendingApprovalPlans?.[0].feasibilityScore).toBe(78.0);
    expect(result.pendingApprovalPlans?.[0].recommendedRank).toBe(2);
    expect(result.pendingApprovalPlans?.[0].rejectionReason).toContain('基準値（80.0）未満');

    // Verify deliveredInstructionCount
    expect(result.deliveredInstructionCount).toBe(2);

    // Verify failedDeliveryCount
    expect(result.failedDeliveryCount).toBe(0);

    // Verify analysisMetadata
    expect(result.analysisMetadata.productivityDataCount).toBe(150);
    expect(result.analysisMetadata.workersAnalyzed).toBe(25);
    expect(result.analysisMetadata.proficiencyLevelsApplied).toContain('初級');
    expect(result.analysisMetadata.proficiencyLevelsApplied).toContain('中級');
    expect(result.analysisMetadata.proficiencyLevelsApplied).toContain('上級');
    expect(result.analysisMetadata.analysisExecutionTimeMs).toBeGreaterThan(0);

    // Verify errorDetails is null
    expect(result.errorDetails).toBeNull();

    // Verify that all mocked functions were called with correct parameters
    expect(authorizeOperation).toHaveBeenCalledWith('USR-ADMIN-001', 'allocate_staff_auto_approve');
    expect(validateReferentialIntegrity).toHaveBeenCalled();
    expect(listProductivityDataByCondition).toHaveBeenCalledWith({
      facilityId: 'FAC-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(getWorkerWithProficiencyAndProductivity).toHaveBeenCalled();
    expect(generateAllocationPlans).toHaveBeenCalled();
    expect(judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledTimes(3);
    expect(saveAllocationPlan).toHaveBeenCalledTimes(3);
    expect(deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(recordOperationAudit).toHaveBeenCalled();
  });
});