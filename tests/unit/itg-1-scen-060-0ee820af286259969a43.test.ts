import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-060: 正常系：実行完了時にexecutionTimestampがISO 8601形式で記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record executionTimestamp in ISO 8601 format on successful completion', async () => {
    // 実行開始時刻を記録（テスト実行環境での現在時刻を基準値）
    const executionStartTime = new Date();
    const executionStartTimeInMs = executionStartTime.getTime();

    // モック化したすべての依存処理を事前に設定
    const mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      userId: 'user-001',
    });

    const mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      delayRiskJudgmentResults: [],
    });

    const mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue({});

    const mockGenerateAllocationPlans = jest.fn().mockResolvedValue({
      generatedAllocationPlans: [],
    });

    const mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue({
      approvalStatus: 'auto_approved',
    });

    const mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue({
      deliveryResults: [],
    });

    const mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue({});

    const mockSaveAllocationPlan = jest.fn().mockResolvedValue({});

    const mockRecordOperationAudit = jest.fn().mockResolvedValue({});

    // Tx3Imp1AiClientインターフェースの実装
    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      saveDelayRiskJudgment: mockSaveDelayRiskJudgment,
      saveAllocationPlan: mockSaveAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // runTx3Imp1Agent関数を入力値で呼び出す
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    // 関数がTx3Imp1AgentOutput型で応答するまで待機する
    const output = await runTx3Imp1Agent(input, aiClient);

    // executionTimestampフィールドが存在することを確認
    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');

    // ISO 8601形式の正規表現でバリデーション
    // 仕様に合わせて末尾のZがオプション（Z?）に対応
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(output.executionTimestamp).toMatch(iso8601Regex);

    // executionTimestampをDate型にパース
    const executionTimestamp = new Date(output.executionTimestamp);

    // parsedDateが有効なDate型であることを確認
    expect(executionTimestamp instanceof Date).toBe(true);
    expect(isNaN(executionTimestamp.getTime())).toBe(false);

    // executionTimestampが実行開始時刻以降であることを確認
    expect(executionTimestamp.getTime()).toBeGreaterThanOrEqual(executionStartTimeInMs);

    // executionTimestampが現在時刻以前であることを確認
    const currentTime = new Date();
    expect(executionTimestamp.getTime()).toBeLessThanOrEqual(currentTime.getTime());

    // executionIdが存在し、executionTimestampと同一レコード内の情報として記録されていることを確認
    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    // delayRiskJudgmentResultsが仕様通り空配列であることを確認
    expect(output.delayRiskJudgmentResults).toEqual([]);

    // generatedAllocationPlansが仕様通り空配列であることを確認
    expect(output.generatedAllocationPlans).toEqual([]);

    // approvalStatusが仕様通り'auto_approved'であることを確認
    expect(output.approvalStatus).toBe('auto_approved');

    // deliveryResultsが仕様通り空配列であることを確認
    expect(output.deliveryResults).toEqual([]);

    // executionStatusが仕様通り'success'であることを確認
    expect(output.executionStatus).toBe('success');

    // errorDetailsがundefinedであることを確認
    expect(output.errorDetails).toBeUndefined();

    // executionIdとexecutionTimestampが同一レコード内に存在することを確認
    expect(output).toHaveProperty('executionId');
    expect(output).toHaveProperty('executionTimestamp');
  });
});