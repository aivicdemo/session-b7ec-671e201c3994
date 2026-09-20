import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-4-imp-1/services/authorization');
jest.mock('../../src/agents/tx-4-imp-1/services/monitoring');
jest.mock('../../src/agents/tx-4-imp-1/services/allocation');
jest.mock('../../src/agents/tx-4-imp-1/services/audit');

import { authorizeOperation } from '../../src/agents/tx-4-imp-1/services/authorization';
import { monitorAndJudgeDelayRisk } from '../../src/agents/tx-4-imp-1/services/monitoring';
import { generateAllocationPlans } from '../../src/agents/tx-4-imp-1/services/allocation';
import { recordOperationAudit } from '../../src/agents/tx-4-imp-1/services/audit';

// Import or define the AllocationPlanGenerationError class
class AllocationPlanGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllocationPlanGenerationError';
  }
}

describe('SCEN-064: 最適人員配置案の生成に失敗した場合のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateAllocationPlans処理で人員配置案の生成に失敗した場合、AllocationPlanGenerationErrorが発生してexecutionStatusがfailedとなる', async () => {
    // テスト対象システムの初期状態を確認
    const executionId = `exec-${Date.now()}-${Math.random()}`;

    // 入力パラメータを構築
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    // authorizeOperationをスタブ化
    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    // monitorAndJudgeDelayRiskをスタブ化
    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [
        {
          facilityId: 'facility-A',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'increase_staffing',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
      ],
    });

    // generateAllocationPlansをスタブ化：AllocationPlanGenerationErrorを発生させる
    (generateAllocationPlans as jest.Mock).mockRejectedValue(
      new AllocationPlanGenerationError(
        '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。'
      )
    );

    // recordOperationAuditをスタブ化
    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    // runTx4Imp1Agentを実行
    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    // 戻り値の出力型Tx4Imp1AgentOutputを検証
    // executionStatusフィールドの値を確認
    expect(result.executionStatus).toBe('failed');

    // エラー情報を検証
    // errorSummaryフィールドの値を確認
    expect(result.errorSummary).toBe(
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。'
    );

    // generatedAllocationPlansは空配列である
    expect(result.generatedAllocationPlans).toEqual([]);

    // approvalResults、deliveredInstructionsは空配列である
    expect(result.approvalResults).toEqual([]);
    expect(result.deliveredInstructions).toEqual([]);

    // delayRiskJudgments、identifiedFacilitiesは遅延リスク判定結果に基づいて正常に格納されている
    expect(result.delayRiskJudgments).toHaveLength(1);
    expect(result.delayRiskJudgments[0].riskScore).toBe(75);
    expect(result.delayRiskJudgments[0].riskLevel).toBe('high');

    expect(result.identifiedFacilities).toHaveLength(1);
    expect(result.identifiedFacilities[0].facilityId).toBe('facility-A');
    expect(result.identifiedFacilities[0].riskPriority).toBe(1);

    // recordOperationAuditにより監査ログが記録されている
    expect(recordOperationAudit).toHaveBeenCalled();
    const auditCall = (recordOperationAudit as jest.Mock).mock.calls[0][0];
    expect(auditCall.userId).toBe('test-user-001');
    expect(auditCall).toHaveProperty('operationContent');
    expect(auditCall).toHaveProperty('errorMessage');
    expect(auditCall.errorMessage).toBe(
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。'
    );
  });

  it('executionIdは一意に生成されていることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [],
      identifiedFacilities: [],
    });

    (generateAllocationPlans as jest.Mock).mockRejectedValue(
      new AllocationPlanGenerationError(
        '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。'
      )
    );

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    const result1: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    const result2: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    expect(result1.executionId).toBeDefined();
    expect(result2.executionId).toBeDefined();
    expect(result1.executionId).not.toBe(result2.executionId);
  });

  it('monitoringTimestampがISO 8601形式で格納されていることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [],
      identifiedFacilities: [],
    });

    (generateAllocationPlans as jest.Mock).mockRejectedValue(
      new AllocationPlanGenerationError(
        '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。'
      )
    );

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    expect(result.monitoringTimestamp).toBeDefined();
    expect(result.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it('AllocationPlanGenerationErrorが適切にキャッチされ、エラー情報が格納されることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    const delayRiskData = {
      delayRiskJudgments: [
        {
          facilityId: 'facility-A',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'increase_staffing',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
      ],
    };

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue(delayRiskData);

    const errorMessage =
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。';
    (generateAllocationPlans as jest.Mock).mockRejectedValue(
      new AllocationPlanGenerationError(errorMessage)
    );

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    // エラーが発生したことを確認
    expect(result.executionStatus).toBe('failed');
    expect(result.errorSummary).toBe(errorMessage);

    // 遅延リスク判定は完了しているが、配置案生成は中断していることを確認
    expect(result.delayRiskJudgments).toEqual(delayRiskData.delayRiskJudgments);
    expect(result.identifiedFacilities).toEqual(delayRiskData.identifiedFacilities);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.approvalResults).toEqual([]);
    expect(result.deliveredInstructions).toEqual([]);
  });

  it('監査ログにはユーザーID、操作内容、エラー結果が記録されることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-002',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [
        {
          facilityId: 'facility-A',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'increase_staffing',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
      ],
    });

    const errorMessage =
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。';
    (generateAllocationPlans as jest.Mock).mockRejectedValue(
      new AllocationPlanGenerationError(errorMessage)
    );

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    expect(recordOperationAudit).toHaveBeenCalled();
    const auditCall = (recordOperationAudit as jest.Mock).mock.calls[0][0];

    expect(auditCall.userId).toBe('test-user-002');
    expect(auditCall).toHaveProperty('operationContent');
    expect(auditCall.operationContent).toContain(
      'allocation_plan_generation'
    );
    expect(auditCall).toHaveProperty('errorMessage');
    expect(auditCall.errorMessage).toBe(errorMessage);
    expect(auditCall).toHaveProperty('operationStatus');
    expect(auditCall.operationStatus).toBe('failed');
  });

  it('AllocationPlanGenerationErrorが実際に処理されてexecutionStatusにfailedが設定されることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-003',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [
        {
          facilityId: 'facility-A',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'increase_staffing',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
      ],
    });

    const errorMessage =
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。';
    const error = new AllocationPlanGenerationError(errorMessage);
    (generateAllocationPlans as jest.Mock).mockRejectedValue(error);

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    // AllocationPlanGenerationErrorが発生して適切に処理されたことを確認
    expect(result.executionStatus).toBe('failed');
    expect(result.errorSummary).toBe(errorMessage);

    // runTx4Imp1Agent内で例外がキャッチされていることをerrorSummaryの存在で検証
    expect(result.errorSummary).not.toBeNull();
    expect(result.errorSummary).toBeTruthy();

    // 配置案生成ステップで中断していることを確認
    expect(result.generatedAllocationPlans).toHaveLength(0);
    expect(result.approvalResults).toHaveLength(0);
    expect(result.deliveredInstructions).toHaveLength(0);

    // 遅延リスク判定は完了していることを確認
    expect(result.delayRiskJudgments.length).toBeGreaterThan(0);
    expect(result.identifiedFacilities.length).toBeGreaterThan(0);
  });

  it('AllocationPlanGenerationErrorが実行内でスローされた場合、executionStatusがfailedになることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-004',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [
        {
          facilityId: 'facility-A',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'increase_staffing',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
      ],
    });

    const errorMessage =
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。';
    (generateAllocationPlans as jest.Mock).mockRejectedValue(
      new AllocationPlanGenerationError(errorMessage)
    );

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    // runTx4Imp1Agentを実行し、例外がスローされないことを確認
    let caughtError: Error | null = null;
    let result: Tx4Imp1AgentOutput | null = null;

    try {
      result = await runTx4Imp1Agent(input, {
        authorizeOperation,
        monitorAndJudgeDelayRisk,
        generateAllocationPlans,
        recordOperationAudit,
      });
    } catch (e) {
      caughtError = e as Error;
    }

    // runTx4Imp1Agent自体は例外をスローせず、結果にエラー情報を含める
    expect(caughtError).toBeNull();
    expect(result).not.toBeNull();

    // AllocationPlanGenerationErrorによるエラーがresultに反映されている
    expect(result!.executionStatus).toBe('failed');
    expect(result!.errorSummary).toBe(errorMessage);
  });

  it('AllocationPlanGenerationErrorのエラーオブジェクトが適切に処理され、エラー名が保持されていることを確認', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-005',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      permissions: ['progress_monitoring', 'staffing_instruction_delivery'],
    });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [
        {
          facilityId: 'facility-A',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'increase_staffing',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
      ],
    });

    const errorMessage =
      '人員配置案の生成に失敗しました。利用可能な作業者情報を確認してください。';
    const allocationError = new AllocationPlanGenerationError(errorMessage);
    expect(allocationError.name).toBe('AllocationPlanGenerationError');

    (generateAllocationPlans as jest.Mock).mockRejectedValue(allocationError);

    (recordOperationAudit as jest.Mock).mockResolvedValue(true);

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      recordOperationAudit,
    });

    // AllocationPlanGenerationErrorが処理されたことを確認
    expect(result.executionStatus).toBe('failed');
    expect(result.errorSummary).toBe(errorMessage);

    // 監査ログにエラーが記録されていることを確認
    expect(recordOperationAudit).toHaveBeenCalled();
    const auditCall = (recordOperationAudit as jest.Mock).mock.calls[0][0];
    expect(auditCall.errorMessage).toBe(errorMessage);
    expect(auditCall.operationStatus).toBe('failed');
  });
});