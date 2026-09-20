import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-065: 遅延リスク判定後、実行可能な人員配置案が生成されない場合', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      authorizeOperation: jest.fn(),
      monitorAndJudgeDelayRisk: jest.fn(),
      generateAllocationPlans: jest.fn(),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      deliverAllocationPlanAndWorkInstructions: jest.fn(),
      recordOperationAudit: jest.fn(),
    };
  });

  it('should return partial_completion status with AllocationPlanNotGeneratedWarning when no executable allocation plans are generated', async () => {
    // ステップ1: テスト対象の権限・入力値を準備
    const input: Tx4Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    // ステップ2: authorizeOperation をスタブ化
    mockAiClient.authorizeOperation.mockResolvedValue({
      authorized: true,
      userRole: 'admin',
    });

    // ステップ3: monitorAndJudgeDelayRisk をスタブ化
    // 遅延リスク判定結果を返す（リスク閾値60以上）
    mockAiClient.monitorAndJudgeDelayRisk.mockResolvedValue({
      delayRiskJudgments: [
        {
          workInstructionId: 'work-001',
          riskScore: 75,
          riskLevel: 'high',
          delayedDays: 2,
          recommendedAction: 'Increase staff allocation',
        },
      ],
      identifiedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 75,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 1,
        },
      ],
    });

    // ステップ4: generateAllocationPlans をスタブ化
    // 実行可能な配置案が生成されない（空配列）
    mockAiClient.generateAllocationPlans.mockResolvedValue({
      generatedAllocationPlans: [],
    });

    // ステップ5: judgeAllocationPlanApprovalWithCriteria をスタブ化
    mockAiClient.judgeAllocationPlanApprovalWithCriteria.mockResolvedValue({
      approvalResults: [],
    });

    // ステップ6: deliverAllocationPlanAndWorkInstructions をスタブ化
    mockAiClient.deliverAllocationPlanAndWorkInstructions.mockResolvedValue({
      deliveredInstructions: [],
    });

    // ステップ7: recordOperationAudit をスタブ化
    mockAiClient.recordOperationAudit.mockResolvedValue({
      auditId: 'audit-001',
      recorded: true,
    });

    // ステップ8: runTx4Imp1Agent を実行
    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient);

    // ステップ9: executionStatus フィールドを検証
    expect(result.executionStatus).toBe('partial_completion');

    // ステップ10: エラー情報（errorSummary）を検証
    expect(result.errorSummary).toBeDefined();
    expect(result.errorSummary).toContain('対応可能な人員配置案がありません');
    expect(result.errorSummary).toContain('手動での対応を検討してください');

    // ステップ11: generatedAllocationPlans が空配列であることを確認
    expect(result.generatedAllocationPlans).toEqual([]);

    // ステップ12: delayRiskJudgments に遅延リスク判定結果が含まれていることを確認
    expect(result.delayRiskJudgments).toHaveLength(1);
    expect(result.delayRiskJudgments[0].riskScore).toBe(75);
    expect(result.delayRiskJudgments[0].riskLevel).toBe('high');

    // ステップ13: deliveredInstructions が空配列であることを確認
    expect(result.deliveredInstructions).toEqual([]);

    // 追加検証: executionId と monitoringTimestamp の形式
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    expect(result.monitoringTimestamp).toBeDefined();
    expect(typeof result.monitoringTimestamp).toBe('string');
    // ISO 8601 形式の検証
    expect(() => new Date(result.monitoringTimestamp)).not.toThrow();
    expect(result.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // identifiedFacilities が返されていることを確認
    expect(result.identifiedFacilities).toHaveLength(1);
    expect(result.identifiedFacilities[0].facilityId).toBe('facility-A');

    // approvalResults が空配列であることを確認
    expect(result.approvalResults).toEqual([]);
  });
});