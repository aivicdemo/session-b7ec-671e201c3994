import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  DelayRiskJudgmentResult,
  AllocationPlanProposal,
  WorkerAssignment,
  DeliveryResult,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-053: 正常系：配置案が自動承認基準を満たして自動承認状態で配信される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockNotificationServiceAdapter: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockWorkerAssignment: WorkerAssignment = {
      workerId: 'worker-001',
      workerName: 'Worker One',
      proficiencyLevel: 'intermediate',
      assignedTaskDifficulty: 'medium',
      allocatedWorkHours: 8,
      expectedProductivityRate: 85,
    };

    const mockDelayRiskResult: DelayRiskJudgmentResult = {
      riskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      workInstructionId: 'instr-001',
      riskLevel: 'high',
      riskScore: 75,
      delayPredictionDays: 2,
      currentProgressRate: 45,
      plannedProgressRate: 65,
      delayReasonClassification: 'personnel_shortage',
    };

    const mockAllocationPlan: AllocationPlanProposal = {
      allocationPlanId: 'plan-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      workInstructionId: 'instr-001',
      proposedWorkerAssignments: [mockWorkerAssignment],
      expectedCompletionDate: '2024-12-31T18:00:00Z',
      feasibilityScore: 92,
      recommendationReason: 'Optimal allocation to reduce delay risk',
      proficiencyAdjustmentApplied: true,
    };

    const mockDeliveryResult: DeliveryResult = {
      deliveryId: 'delivery-001',
      allocationPlanId: 'plan-001',
      recipientType: 'team_leader',
      recipientId: 'leader-001',
      deliveryStatus: 'success',
      deliveryTimestamp: new Date().toISOString(),
    };

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue([mockDelayRiskResult]);

    mockGetWorkerWithProficiencyAndProductivity = jest
      .fn()
      .mockResolvedValue([\n        {\n          workerId: 'worker-001',
          workerName: 'Worker One',
          proficiencyLevel: 'intermediate',
          currentProductivityRate: 85,
        },
      ]);

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([mockAllocationPlan]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue({ approvalStatus: 'auto_approved' });

    mockNotificationServiceAdapter = jest.fn().mockResolvedValue({
      deliveryId: 'delivery-001',
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockImplementation(async (plans) => {
        const deliveries: DeliveryResult[] = [];
        for (const plan of plans) {
          const notification = await mockNotificationServiceAdapter(plan);
          deliveries.push({
            deliveryId: notification.deliveryId,
            allocationPlanId: plan.allocationPlanId,
            recipientType: 'team_leader',
            recipientId: 'leader-001',
            deliveryStatus: notification.status,
            deliveryTimestamp: notification.timestamp,
          });
        }
        return deliveries;
      });

    mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue(undefined);

    mockSaveAllocationPlan = jest.fn().mockResolvedValue(undefined);

    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);
  });

  it('should execute the complete workflow from delay risk detection to staff allocation delivery with correct call order', async () => {
    // ステップ1：入力を構築
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001', 'fac-002'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'user-approver-001',
      executionContext: 'scheduled_monitoring',
    };

    // ステップ2：エージェントを呼び出す
    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {
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

    // ステップ3：権限チェックが呼び出されたことを確認
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-001');
    expect(mockAuthorizeOperation).toHaveBeenCalledTimes(1);

    // ステップ4：遅延リスク判定が呼び出されたことを確認
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledTimes(1);

    // ステップ5：作業者データ取得が呼び出されたことを確認
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalled();
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalledTimes(1);

    // ステップ6：配置案生成が呼び出されたことを確認
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalledTimes(1);

    // ステップ7：承認判定が呼び出されたことを確認
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledTimes(1);

    // ステップ8：遅延リスク判定結果が保存されたことを確認
    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();

    // ステップ9：配置案が保存されたことを確認
    expect(mockSaveAllocationPlan).toHaveBeenCalled();

    // ステップ10：配置案と作業指示が配信されたことを確認
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalledTimes(1);

    // deliverAllocationPlanAndWorkInstructionsの呼び出し内容を確認
    const deliverCall = mockDeliverAllocationPlanAndWorkInstructions.mock.calls[0];
    expect(deliverCall).toBeDefined();
    expect(Array.isArray(deliverCall[0])).toBe(true); // 配置案の配列
    expect(deliverCall[0].length).toBeGreaterThan(0);
    expect(deliverCall[0][0]).toHaveProperty('allocationPlanId');

    // 外部通知サービス（NotificationServiceAdapter経由Twilio）経由の配信を確認
    expect(mockNotificationServiceAdapter).toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.mock.calls.length).toBeGreaterThan(0);
    mockNotificationServiceAdapter.mock.calls.forEach((call) => {
      expect(call[0]).toHaveProperty('allocationPlanId');
      expect(call[0]).toHaveProperty('proposedWorkerAssignments');
    });

    // ステップ11：操作監査ログが記録されたことを確認（userId='user-001'、操作='Tx3Imp1Agent実行'）
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      'user-001',
      expect.any(String),
    );

    // 呼び出し順序を検証（期待結果：1-9の順序で実行）
    const callOrder = [
      mockAuthorizeOperation,
      mockMonitorAndJudgeDelayRisk,
      mockGetWorkerWithProficiencyAndProductivity,
      mockGenerateAllocationPlans,
      mockJudgeAllocationPlanApprovalWithCriteria,
      mockSaveDelayRiskJudgment,
      mockSaveAllocationPlan,
      mockDeliverAllocationPlanAndWorkInstructions,
      mockRecordOperationAudit,
    ];

    for (let i = 0; i < callOrder.length - 1; i++) {
      expect(callOrder[i].mock.invocationCallOrder[0]).toBeLessThan(
        callOrder[i + 1].mock.invocationCallOrder[0],
      );
    }

    // ステップ12：出力の検証
    // executionIdが一意の文字列であることを確認
    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    // delayRiskJudgmentResultsが空でない配列であることを確認
    expect(Array.isArray(output.delayRiskJudgmentResults)).toBe(true);
    expect(output.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    output.delayRiskJudgmentResults.forEach((result) => {
      expect(result).toHaveProperty('riskJudgmentId');
      expect(result).toHaveProperty('facilityId');
      expect(result).toHaveProperty('teamId');
      expect(result).toHaveProperty('workInstructionId');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('riskScore');
    });

    // generatedAllocationPlansが空でない配列であることを確認
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThan(0);
    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('proposedWorkerAssignments');
      expect(plan).toHaveProperty('expectedCompletionDate');
    });

    // approvalStatusが'auto_approved'であることを確認
    expect(output.approvalStatus).toBe('auto_approved');

    // deliveryResultsが空でない配列であることを確認
    expect(Array.isArray(output.deliveryResults)).toBe(true);
    expect(output.deliveryResults.length).toBeGreaterThan(0);
    output.deliveryResults.forEach((delivery) => {
      expect(delivery).toHaveProperty('deliveryId');
      expect(typeof delivery.deliveryId).toBe('string');
      expect(delivery.deliveryId.length).toBeGreaterThan(0);
      expect(delivery).toHaveProperty('deliveryStatus');
      expect(delivery.deliveryStatus).toBe('success');
      expect(delivery).toHaveProperty('deliveryTimestamp');
      // ISO 8601形式を確認：タイムスタンプが有効な日付に解析でき、ISO 8601形式であることを検証
      const timestamp = new Date(delivery.deliveryTimestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      // ISO 8601形式の正規表現で検証
      expect(delivery.deliveryTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
      );
    });

    // executionStatusが'success'であることを確認
    expect(output.executionStatus).toBe('success');

    // errorDetailsが任意であることを確認
    if (output.errorDetails !== undefined) {
      expect(Array.isArray(output.errorDetails)).toBe(true);
    }

    // executionTimestampがISO 8601形式であることを確認
    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');
    const execTimestamp = new Date(output.executionTimestamp);
    expect(execTimestamp.toString()).not.toBe('Invalid Date');
    expect(output.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );
  });

  it('should verify that allocation plans and work instructions are delivered through the delivery service', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001', 'fac-002'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'user-approver-001',
      executionContext: 'scheduled_monitoring',
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

    // deliverAllocationPlanAndWorkInstructionsが呼び出されたことを確認
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalledTimes(1);

    // 配置案が配信されたことを確認
    const deliverCall = mockDeliverAllocationPlanAndWorkInstructions.mock.calls[0];
    expect(deliverCall[0]).toBeDefined();
    expect(Array.isArray(deliverCall[0])).toBe(true);
    const deliveredPlans = deliverCall[0] as AllocationPlanProposal[];
    expect(deliveredPlans.length).toBeGreaterThan(0);
    deliveredPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('proposedWorkerAssignments');
      expect(Array.isArray(plan.proposedWorkerAssignments)).toBe(true);
    });

    // 外部通知サービス（NotificationServiceAdapter経由Twilio）経由の配信を確認
    expect(mockNotificationServiceAdapter).toHaveBeenCalled();
    const notificationCalls = mockNotificationServiceAdapter.mock.calls;
    expect(notificationCalls.length).toBeGreaterThan(0);

    notificationCalls.forEach((call) => {
      const plan = call[0] as AllocationPlanProposal;
      // 人員配置案が配信されたことを確認
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('proposedWorkerAssignments');
      expect(Array.isArray(plan.proposedWorkerAssignments)).toBe(true);
      // 作業指示情報を含むことを確認
      expect(plan.proposedWorkerAssignments.length).toBeGreaterThan(0);
      plan.proposedWorkerAssignments.forEach((assignment) => {
        expect(assignment).toHaveProperty('workerId');
        expect(assignment).toHaveProperty('allocatedWorkHours');
      });
    });

    // 配送結果の検証：各要素が有効な配送IDとISO 8601形式のタイムスタンプを持つことを確認
    expect(output.deliveryResults.length).toBeGreaterThan(0);
    output.deliveryResults.forEach((delivery) => {
      // 配信IDが有効な文字列であることを確認
      expect(typeof delivery.deliveryId).toBe('string');
      expect(delivery.deliveryId.length).toBeGreaterThan(0);
      // 配信ステータスが成功であることを確認
      expect(delivery.deliveryStatus).toBe('success');
      // タイムスタンプがISO 8601形式であることを確認
      const timestamp = new Date(delivery.deliveryTimestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(delivery.deliveryTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
      );
    });
  });
});