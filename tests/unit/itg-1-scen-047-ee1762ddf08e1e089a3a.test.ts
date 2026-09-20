import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-3-imp-1/prompts/action-01', () => ({
  buildAction01Prompt: jest.fn(),
  ACTION_01_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-3-imp-1/prompts/action-02', () => ({
  buildAction02Prompt: jest.fn(),
  ACTION_02_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-3-imp-1/prompts/action-03', () => ({
  buildAction03Prompt: jest.fn(),
  ACTION_03_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-3-imp-1/prompts/action-04', () => ({
  buildAction04Prompt: jest.fn(),
  ACTION_04_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-3-imp-1/prompts/action-05', () => ({
  buildAction05Prompt: jest.fn(),
  ACTION_05_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-3-imp-1/prompts/action-06', () => ({
  buildAction06Prompt: jest.fn(),
  ACTION_06_PROMPT_VERSION: '1.0.0',
}));

describe('SCEN-047: エラー系：承認済み配置案を現場リーダーへ配信できずに配信失敗エラーが発生する', () => {
  let mockDelayRiskResults: any[];
  let mockAllocationPlans: any[];
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup test data: delay risk judgment results
    mockDelayRiskResults = [
      {
        riskJudgmentId: 'risk-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        riskLevel: 'high',
        riskScore: 85,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        delayReasonClassification: 'personnel_shortage',
      },
    ];

    // Setup test data: allocation plans
    mockAllocationPlans = [
      {
        allocationPlanId: 'plan-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        proposedWorkerAssignments: [
          {
            workerId: 'worker-001',
            workerName: 'Test Worker',
            proficiencyLevel: 'intermediate',
            assignedTaskDifficulty: 'medium',
            allocatedWorkHours: 8,
            expectedProductivityRate: 85,
          },
        ],
        expectedCompletionDate: '2024-12-31T00:00:00Z',
        feasibilityScore: 92,
        recommendationReason: 'Addresses personnel shortage with qualified worker',
        proficiencyAdjustmentApplied: true,
      },
    ];

    // Mock delivery failure
    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockRejectedValue(
      new Error('配置指示の配信に失敗しました。現場リーダーへの通知状況を確認してください。')
    );

    mockRecordOperationAudit = jest.fn().mockResolvedValue({});
  });

  test('配置案生成・承認後、配信失敗時にpartial_successが返される', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'scheduled_monitoring',
    };

    const mockAiClient = {
      processDelayRiskJudgment: jest.fn().mockResolvedValue(mockDelayRiskResults),
      generateOptimalAllocationPlans: jest.fn().mockResolvedValue(mockAllocationPlans),
      evaluateApprovalCriteria: jest.fn().mockResolvedValue({
        approved: true,
        approvalStatus: 'auto_approved',
      }),
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert
    expect(result.executionStatus).toBe('partial_success');
    expect(result.approvalStatus).toBe('auto_approved');
    expect(result.deliveryResults.length).toBeGreaterThanOrEqual(1);

    const failedDelivery = result.deliveryResults.find(d => d.deliveryStatus === 'failed');
    expect(failedDelivery).toBeDefined();
    expect(failedDelivery?.failureReason).toContain('配置指示の配信に失敗しました');

    expect(result.errorDetails.length).toBeGreaterThanOrEqual(1);
    const deliveryError = result.errorDetails.find(e => e.errorCode === 'DELIVERY_FAILURE');
    expect(deliveryError).toBeDefined();
    expect(deliveryError?.errorMessage).toContain('配置指示の配信に失敗しました。現場リーダーへの通知状況を確認してください。');

    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  test('配信失敗時にerrorDetailsに適切なエラー情報が含まれる', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'scheduled_monitoring',
    };

    const mockAiClient = {
      processDelayRiskJudgment: jest.fn().mockResolvedValue(mockDelayRiskResults),
      generateOptimalAllocationPlans: jest.fn().mockResolvedValue(mockAllocationPlans),
      evaluateApprovalCriteria: jest.fn().mockResolvedValue({
        approved: true,
        approvalStatus: 'auto_approved',
      }),
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails.length).toBeGreaterThanOrEqual(1);

    const errorDetail = result.errorDetails[0];
    expect(errorDetail.errorCode).toBe('DELIVERY_FAILURE');
    expect(errorDetail.errorMessage).toContain('配置指示の配信に失敗しました');
    expect(errorDetail.affectedFacilityId).toBe('facility-001');
    expect(errorDetail.affectedTeamId).toBe('team-001');
    expect(errorDetail.errorTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  test('配信失敗時にdeliveryResultsに失敗情報が記録される', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'scheduled_monitoring',
    };

    const mockAiClient = {
      processDelayRiskJudgment: jest.fn().mockResolvedValue(mockDelayRiskResults),
      generateOptimalAllocationPlans: jest.fn().mockResolvedValue(mockAllocationPlans),
      evaluateApprovalCriteria: jest.fn().mockResolvedValue({
        approved: true,
        approvalStatus: 'auto_approved',
      }),
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert
    expect(result.deliveryResults).toBeDefined();
    expect(result.deliveryResults.length).toBeGreaterThanOrEqual(1);

    const failedResult = result.deliveryResults[0];
    expect(failedResult.deliveryStatus).toBe('failed');
    expect(failedResult.failureReason).toContain('配置指示の配信に失敗しました');
    expect(failedResult.allocationPlanId).toBe('plan-001');
    expect(failedResult.facilityId).toBe('facility-001');

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  test('配信失敗時にapprovalStatusが承認済み状態を保持', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'scheduled_monitoring',
    };

    const mockAiClient = {
      processDelayRiskJudgment: jest.fn().mockResolvedValue(mockDelayRiskResults),
      generateOptimalAllocationPlans: jest.fn().mockResolvedValue(mockAllocationPlans),
      evaluateApprovalCriteria: jest.fn().mockResolvedValue({
        approved: true,
        approvalStatus: 'auto_approved',
      }),
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert
    expect(result.approvalStatus).toBe('auto_approved');

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  test('executionTimestampがISO 8601形式で返される', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'scheduled_monitoring',
    };

    const mockAiClient = {
      processDelayRiskJudgment: jest.fn().mockResolvedValue(mockDelayRiskResults),
      generateOptimalAllocationPlans: jest.fn().mockResolvedValue(mockAllocationPlans),
      evaluateApprovalCriteria: jest.fn().mockResolvedValue({
        approved: true,
        approvalStatus: 'auto_approved',
      }),
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // Act
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.executionTimestamp).toMatch(iso8601Regex);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });
});