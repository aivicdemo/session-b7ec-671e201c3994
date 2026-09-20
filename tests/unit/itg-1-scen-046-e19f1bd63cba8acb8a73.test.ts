import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  DelayRiskJudgmentResult,
  AllocationPlanProposal,
  WorkerAssignment,
  ErrorDetail,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-046: 承認者からの判定が得られないまたは配置案が却下されて承認不可エラーが発生する', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn();
    mockMonitorAndJudgeDelayRisk = jest.fn();
    mockGetWorkerWithProficiencyAndProductivity = jest.fn();
    mockGenerateAllocationPlans = jest.fn();
    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn();
    mockDeliverAllocationPlanAndWorkInstructions = jest.fn();
    mockSaveDelayRiskJudgment = jest.fn();
    mockSaveAllocationPlan = jest.fn();
    mockRecordOperationAudit = jest.fn();
  });

  describe('シナリオA: 承認者からの判定が得られない場合', () => {
    it('承認者タイムアウトで ApprovalTimeoutOrRejection エラーが返されること', async () => {
      // ステップ1: 権限検証成功
      mockAuthorizeOperation.mockResolvedValue({ authorized: true });

      // ステップ2: 遅延リスク検知成功
      const delayRiskResult: DelayRiskJudgmentResult = {
        riskJudgmentId: 'risk-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        riskLevel: 'high',
        riskScore: 85,
        delayPredictionDays: 2,
        currentProgressRate: 35,
        plannedProgressRate: 50,
        delayReasonClassification: 'personnel_shortage',
      };

      mockMonitorAndJudgeDelayRisk.mockResolvedValue({
        delayRiskJudgmentResults: [delayRiskResult],
      });

      // ステップ3: 利用可能な作業者データ
      const workerAssignment: WorkerAssignment = {
        workerId: 'worker-001',
        workerName: '田中太郎',
        proficiencyLevel: 'intermediate',
        assignedTaskDifficulty: 'medium',
        allocatedWorkHours: 8,
        expectedProductivityRate: 75,
      };

      mockGetWorkerWithProficiencyAndProductivity.mockResolvedValue({
        workers: [workerAssignment],
      });

      // ステップ4: 配置案生成
      const allocationPlan: AllocationPlanProposal = {
        allocationPlanId: 'plan-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        proposedWorkerAssignments: [workerAssignment],
        expectedCompletionDate: '2024-12-20',
        feasibilityScore: 85,
        recommendationReason: '進捗遅延リスクを低減する最適配置',
        proficiencyAdjustmentApplied: true,
      };

      mockGenerateAllocationPlans.mockResolvedValue({
        generatedAllocationPlans: [allocationPlan],
      });

      // ステップ5: 承認者からの判定が得られない（タイムアウト）
      mockJudgeAllocationPlanApprovalWithCriteria.mockResolvedValue(null);

      // ステップ6: エージェント実行
      const input: Tx3Imp1AgentInput = {
        userId: 'user-001',
        facilityIds: ['facility-001'],
        teamIds: ['team-001'],
        riskThresholdScore: 70,
        approverUserId: 'approver-001',
        executionContext: 'manual_trigger',
      };

      const output = await runTx3Imp1Agent(input, {
        authorizeOperation: mockAuthorizeOperation,
        monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
        getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
        generateAllocationPlans: mockGenerateAllocationPlans,
        judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
        deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
        saveDelayRiskJudgment: mockSaveDelayRiskJudgment,
        saveAllocationPlan: mockSaveAllocationPlan,
        recordOperationAudit: mockRecordOperationAudit,
      });

      // ステップ7: 返却結果の検証
      expect(output.executionId).toBeTruthy();
      expect(output.executionId).toMatch(/^[a-zA-Z0-9\-]+$/);

      expect(output.delayRiskJudgmentResults).toHaveLength(1);
      expect(output.delayRiskJudgmentResults[0].riskJudgmentId).toBe('risk-001');

      expect(output.generatedAllocationPlans).toHaveLength(1);
      expect(output.generatedAllocationPlans[0].allocationPlanId).toBe('plan-001');

      expect(['pending_approval', 'rejected']).toContain(output.approvalStatus);

      expect(output.deliveryResults).toEqual([]);

      expect(['partial_success', 'failure']).toContain(output.executionStatus);

      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails?.length).toBeGreaterThan(0);

      const approvalError = output.errorDetails?.find(
        (e) => e.errorCode === 'ApprovalTimeoutOrRejection'
      );
      expect(approvalError).toBeDefined();
      expect(approvalError?.errorMessage).toBe(
        '人員配置案の承認が得られませんでした。承認者の判定を確認してください。'
      );

      expect(output.executionTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });
  });

  describe('シナリオB: 配置案が却下された場合', () => {
    it('配置案却下で ApprovalTimeoutOrRejection エラーが返されること', async () => {
      // ステップ8: 権限検証成功
      mockAuthorizeOperation.mockResolvedValue({ authorized: true });

      // ステップ9: 遅延リスク検知成功
      const delayRiskResult: DelayRiskJudgmentResult = {
        riskJudgmentId: 'risk-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        riskLevel: 'high',
        riskScore: 88,
        delayPredictionDays: 3,
        currentProgressRate: 30,
        plannedProgressRate: 55,
        delayReasonClassification: 'efficiency_decline',
      };

      mockMonitorAndJudgeDelayRisk.mockResolvedValue({
        delayRiskJudgmentResults: [delayRiskResult],
      });

      // ステップ10: 利用可能な作業者データ
      const workerAssignment: WorkerAssignment = {
        workerId: 'worker-002',
        workerName: '鈴木花子',
        proficiencyLevel: 'advanced',
        assignedTaskDifficulty: 'hard',
        allocatedWorkHours: 10,
        expectedProductivityRate: 80,
      };

      mockGetWorkerWithProficiencyAndProductivity.mockResolvedValue({
        workers: [workerAssignment],
      });

      // ステップ11: 配置案生成
      const allocationPlan: AllocationPlanProposal = {
        allocationPlanId: 'plan-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        workInstructionId: 'work-002',
        proposedWorkerAssignments: [workerAssignment],
        expectedCompletionDate: '2024-12-25',
        feasibilityScore: 75,
        recommendationReason: '効率低下を改善する配置',
        proficiencyAdjustmentApplied: true,
      };

      mockGenerateAllocationPlans.mockResolvedValue({
        generatedAllocationPlans: [allocationPlan],
      });

      // ステップ12: 配置案が却下される
      mockJudgeAllocationPlanApprovalWithCriteria.mockResolvedValue({
        approvalStatus: 'rejected',
        reason: '配置案が運用ルールに違反しています',
      });

      // ステップ13: エージェント実行
      const input: Tx3Imp1AgentInput = {
        userId: 'user-002',
        facilityIds: ['facility-002'],
        teamIds: ['team-002'],
        riskThresholdScore: 75,
        approverUserId: 'approver-002',
        executionContext: 'manual_trigger',
      };

      const output = await runTx3Imp1Agent(input, {
        authorizeOperation: mockAuthorizeOperation,
        monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
        getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
        generateAllocationPlans: mockGenerateAllocationPlans,
        judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
        deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
        saveDelayRiskJudgment: mockSaveDelayRiskJudgment,
        saveAllocationPlan: mockSaveAllocationPlan,
        recordOperationAudit: mockRecordOperationAudit,
      });

      // ステップ14: 返却結果の検証
      expect(output.executionId).toBeTruthy();
      expect(output.executionId).toMatch(/^[a-zA-Z0-9\-]+$/);

      expect(output.delayRiskJudgmentResults).toHaveLength(1);
      expect(output.delayRiskJudgmentResults[0].riskJudgmentId).toBe('risk-002');

      expect(output.generatedAllocationPlans).toHaveLength(1);
      expect(output.generatedAllocationPlans[0].allocationPlanId).toBe('plan-002');

      expect(output.approvalStatus).toBe('rejected');

      expect(output.deliveryResults).toEqual([]);

      expect(['partial_success', 'failure']).toContain(output.executionStatus);

      expect(output.errorDetails).toBeDefined();
      expect(output.errorDetails?.length).toBeGreaterThan(0);

      const approvalError = output.errorDetails?.find(
        (e) => e.errorCode === 'ApprovalTimeoutOrRejection'
      );
      expect(approvalError).toBeDefined();
      expect(approvalError?.errorMessage).toBe(
        '人員配置案の承認が得られませんでした。承認者の判定を確認してください。'
      );

      expect(output.executionTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );

      // 監査ログが記録されている
      expect(mockRecordOperationAudit).toHaveBeenCalled();
    });
  });
});