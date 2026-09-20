import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-3-imp-1/services/authorization');
jest.mock('../../src/agents/tx-3-imp-1/services/delay-risk-judgment');
jest.mock('../../src/agents/tx-3-imp-1/services/worker-data');
jest.mock('../../src/agents/tx-3-imp-1/services/allocation-plan-generation');
jest.mock('../../src/agents/tx-3-imp-1/services/allocation-plan-storage');
jest.mock('../../src/agents/tx-3-imp-1/services/approval-judgment');
jest.mock('../../src/agents/tx-3-imp-1/services/allocation-delivery');
jest.mock('../../src/agents/tx-3-imp-1/services/audit-log');

describe('SCEN-057: エラー系：配置案生成失敗時に部分成功状態で承認・配信ステップがスキップされる', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const { authorizeOperation } = require('../../src/agents/tx-3-imp-1/services/authorization');
    const { monitorAndJudgeDelayRisk, saveDelayRiskJudgment } = require('../../src/agents/tx-3-imp-1/services/delay-risk-judgment');
    const { getWorkerWithProficiencyAndProductivity } = require('../../src/agents/tx-3-imp-1/services/worker-data');
    const { generateAllocationPlans } = require('../../src/agents/tx-3-imp-1/services/allocation-plan-generation');
    const { saveAllocationPlan } = require('../../src/agents/tx-3-imp-1/services/allocation-plan-storage');
    const { judgeAllocationPlanApprovalWithCriteria } = require('../../src/agents/tx-3-imp-1/services/approval-judgment');
    const { deliverAllocationPlanAndWorkInstructions } = require('../../src/agents/tx-3-imp-1/services/allocation-delivery');
    const { recordOperationAudit } = require('../../src/agents/tx-3-imp-1/services/audit-log');

    mockAuthorizeOperation = authorizeOperation;
    mockMonitorAndJudgeDelayRisk = monitorAndJudgeDelayRisk;
    mockSaveDelayRiskJudgment = saveDelayRiskJudgment;
    mockGetWorkerWithProficiencyAndProductivity = getWorkerWithProficiencyAndProductivity;
    mockGenerateAllocationPlans = generateAllocationPlans;
    mockSaveAllocationPlan = saveAllocationPlan;
    mockJudgeAllocationPlanApprovalWithCriteria = judgeAllocationPlanApprovalWithCriteria;
    mockDeliverAllocationPlanAndWorkInstructions = deliverAllocationPlanAndWorkInstructions;
    mockRecordOperationAudit = recordOperationAudit;
  });

  it('should return partial_success state with empty allocation plans and skip approval/delivery steps when allocation plan generation fails', async () => {
    // Prepare input data
    const input: Tx3Imp1AgentInput = {
      userId: 'user001',
      facilityIds: ['fac001'],
      teamIds: ['team001'],
      riskThresholdScore: 70,
      approverUserId: 'approver001',
      executionContext: 'manual_trigger',
    };

    // Stub: authorizeOperation returns success
    mockAuthorizeOperation.mockResolvedValueOnce({
      authorized: true,
      userId: 'user001',
      permission: '進捗遅延リスク判定結果確認・配置案承認・配置指示配信',
    });

    // Stub: monitorAndJudgeDelayRisk returns delay risk judgment results
    const delayRiskJudgmentResults = [
      {
        riskJudgmentId: 'risk001',
        facilityId: 'fac001',
        teamId: 'team001',
        workInstructionId: 'work001',
        riskLevel: 'high',
        riskScore: 85,
        delayPredictionDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 70,
        delayReasonClassification: 'personnel_shortage',
      },
    ];
    mockMonitorAndJudgeDelayRisk.mockResolvedValueOnce(delayRiskJudgmentResults);

    // Stub: saveDelayRiskJudgment returns success
    mockSaveDelayRiskJudgment.mockResolvedValueOnce({ success: true });

    // Stub: getWorkerWithProficiencyAndProductivity returns worker data
    const workerData = [
      {
        workerId: 'worker001',
        workerName: 'John Doe',
        proficiencyLevel: 'intermediate',
        assignedTaskDifficulty: 'medium',
        allocatedWorkHours: 8,
        expectedProductivityRate: 85,
      },
    ];
    mockGetWorkerWithProficiencyAndProductivity.mockResolvedValueOnce(workerData);

    // Stub: generateAllocationPlans throws AllocationPlanGenerationFailure error
    const allocationPlanError = new Error('最適人員配置案の生成に失敗しました。利用可能な作業者と習熟度情報を確認してください。');
    allocationPlanError.name = 'AllocationPlanGenerationFailure';
    mockGenerateAllocationPlans.mockRejectedValueOnce(allocationPlanError);

    // Stub: recordOperationAudit for audit log
    mockRecordOperationAudit.mockResolvedValueOnce({ success: true });

    // Execute the agent
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input);

    // Verify execution status is partial_success
    expect(result.executionStatus).toBe('partial_success');

    // Verify generatedAllocationPlans is empty
    expect(result.generatedAllocationPlans).toEqual([]);

    // Verify approvalStatus is either undefined or skipped
    expect(
      result.approvalStatus === undefined ||
      result.approvalStatus === 'skipped'
    ).toBe(true);

    // Verify deliveryResults is empty
    expect(result.deliveryResults).toEqual([]);

    // Verify errorDetails contains AllocationPlanGenerationFailure error with correct structure
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails!.length).toBeGreaterThan(0);
    const allocationError = result.errorDetails!.find(
      (err) => err.errorCode === 'AllocationPlanGenerationFailure'
    );
    expect(allocationError).toBeDefined();
    expect(allocationError!.errorMessage).toBe(
      '最適人員配置案の生成に失敗しました。利用可能な作業者と習熟度情報を確認してください。'
    );
    expect(allocationError!.errorTimestamp).toBeDefined();

    // Verify delayRiskJudgmentResults were successfully obtained and saved
    expect(result.delayRiskJudgmentResults).toEqual(delayRiskJudgmentResults);

    // Verify that saveAllocationPlan was never called
    expect(mockSaveAllocationPlan).not.toHaveBeenCalled();

    // Verify that judgeAllocationPlanApprovalWithCriteria was never called
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();

    // Verify that deliverAllocationPlanAndWorkInstructions was never called
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    // Verify audit log was recorded with failure status
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      'user001',
      '進捗遅延リスク判定・人員配置最適化エンジン実行',
      result.executionId,
      'failure'
    );

    // Verify that executionTimestamp is set
    expect(result.executionTimestamp).toBeDefined();
  });
});