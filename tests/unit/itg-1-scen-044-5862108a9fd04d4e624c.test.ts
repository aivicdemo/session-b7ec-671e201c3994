import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

jest.mock('../../src/agents/tx-3-imp-1/services/progress-monitoring-risk-engine', () => ({
  monitorAndJudgeDelayRisk: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/authorization', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/worker-management', () => ({
  getWorkerWithProficiencyAndProductivity: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/allocation-plan-generation', () => ({
  generateAllocationPlans: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/approval-judgment', () => ({
  judgeAllocationPlanApprovalWithCriteria: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/delivery-service', () => ({
  deliverAllocationPlanAndWorkInstructions: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/persistence', () => ({
  saveDelayRiskJudgment: jest.fn(),
  saveAllocationPlan: jest.fn(),
  recordOperationAudit: jest.fn(),
}));

describe('SCEN-044: エラー系 - WMSまたは生産性データ取得失敗時に遅延リスク判定失敗エラー', () => {
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const progressMonitoringModule = require('../../src/agents/tx-3-imp-1/services/progress-monitoring-risk-engine');
    const authorizationModule = require('../../src/agents/tx-3-imp-1/services/authorization');
    const workerManagementModule = require('../../src/agents/tx-3-imp-1/services/worker-management');
    const allocationPlanGenerationModule = require('../../src/agents/tx-3-imp-1/services/allocation-plan-generation');
    const approvalJudgmentModule = require('../../src/agents/tx-3-imp-1/services/approval-judgment');
    const deliveryServiceModule = require('../../src/agents/tx-3-imp-1/services/delivery-service');
    const persistenceModule = require('../../src/agents/tx-3-imp-1/services/persistence');

    mockMonitorAndJudgeDelayRisk = progressMonitoringModule.monitorAndJudgeDelayRisk;
    mockAuthorizeOperation = authorizationModule.authorizeOperation;
    mockGetWorkerWithProficiencyAndProductivity =
      workerManagementModule.getWorkerWithProficiencyAndProductivity;
    mockGenerateAllocationPlans = allocationPlanGenerationModule.generateAllocationPlans;
    mockJudgeAllocationPlanApprovalWithCriteria =
      approvalJudgmentModule.judgeAllocationPlanApprovalWithCriteria;
    mockDeliverAllocationPlanAndWorkInstructions =
      deliveryServiceModule.deliverAllocationPlanAndWorkInstructions;
    mockSaveDelayRiskJudgment = persistenceModule.saveDelayRiskJudgment;
    mockSaveAllocationPlan = persistenceModule.saveAllocationPlan;
    mockRecordOperationAudit = persistenceModule.recordOperationAudit;

    // ステップ3: 他の処理は正常系で動作するよう設定
    mockAuthorizeOperation.mockResolvedValue(true);
    mockGetWorkerWithProficiencyAndProductivity.mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      proficiencyLevel: 'intermediate',
    });
    mockGenerateAllocationPlans.mockResolvedValue([]);
    mockJudgeAllocationPlanApprovalWithCriteria.mockResolvedValue({
      approvalStatus: 'pending_approval',
    });
    mockDeliverAllocationPlanAndWorkInstructions.mockResolvedValue([]);
    mockSaveDelayRiskJudgment.mockResolvedValue('judgment-001');
    mockSaveAllocationPlan.mockResolvedValue('plan-001');
    mockRecordOperationAudit.mockResolvedValue(undefined);
  });

  it('WMS接続タイムアウト時、DelayRiskMonitoringFailureエラーが発生し、executionStatusがfailureとなる', async () => {
    // ステップ1: 有効な入力データを準備
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 70,
    };

    // ステップ2: monitorAndJudgeDelayRiskをスタブ化し、WMS接続タイムアウトエラーを返すよう設定
    const dataRetrievalError = new Error('WMS connection timeout');
    mockMonitorAndJudgeDelayRisk.mockRejectedValue(dataRetrievalError);

    // ステップ4: runTx3Imp1Agentを呼び出し
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {});

    // ステップ5: monitorAndJudgeDelayRiskが呼ばれ、エラーが発生したことを確認
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        facilityIds: ['facility-001'],
        teamIds: ['team-001'],
        riskThresholdScore: 70,
      })
    );

    // ステップ6: executionStatusがfailureであることを確認
    expect(result.executionStatus).toBe('failure');

    // ステップ7a: delayRiskJudgmentResults、generatedAllocationPlans、deliveryResultsが空配列
    expect(result.delayRiskJudgmentResults).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.deliveryResults).toEqual([]);

    // ステップ6,8: errorDetailsにDelayRiskMonitoringFailureエラー情報が格納
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails.length).toBeGreaterThan(0);
    const delayRiskError = result.errorDetails.find(
      (err) => err.errorCode === 'DelayRiskMonitoringFailure'
    );
    expect(delayRiskError).toBeDefined();
    expect(delayRiskError?.errorMessage).toContain(
      '進捗遅延リスク監視に失敗しました。リアルタイムデータの取得を確認してください。'
    );
  });

  it('HTTP 500エラーなど異なるデータ形式エラーでも、DelayRiskMonitoringFailureエラーハンドリングが適用される', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user-002',
      facilityIds: ['facility-002'],
      teamIds: ['team-002'],
      riskThresholdScore: 70,
    };

    // ステップ2: データ形式エラー（HTTP 500）を返すよう設定
    const formatError = new Error('HTTP 500: Internal Server Error');
    mockMonitorAndJudgeDelayRisk.mockRejectedValue(formatError);

    // ステップ4: runTx3Imp1Agentを呼び出し
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {});

    // ステップ5: エラーが発生したことを確認
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();

    // ステップ6: executionStatusがfailureであることを確認
    expect(result.executionStatus).toBe('failure');

    // ステップ7: 空配列であることを確認
    expect(result.delayRiskJudgmentResults).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.deliveryResults).toEqual([]);

    // ステップ6,8: errorDetailsにエラー情報が格納
    expect(result.errorDetails.length).toBeGreaterThan(0);
    const delayRiskError = result.errorDetails.find(
      (err) => err.errorCode === 'DelayRiskMonitoringFailure'
    );
    expect(delayRiskError).toBeDefined();
    expect(delayRiskError?.errorMessage).toContain(
      '進捗遅延リスク監視に失敗しました。リアルタイムデータの取得を確認してください。'
    );
  });

  it('生産性データ取得エラー時も同じDelayRiskMonitoringFailureエラーハンドリングが適用される', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user-003',
      facilityIds: ['facility-003'],
      teamIds: ['team-003'],
      riskThresholdScore: 70,
    };

    // ステップ2: 生産性データ取得エラーを返すよう設定
    const productivityError = new Error('Failed to fetch productivity data');
    mockMonitorAndJudgeDelayRisk.mockRejectedValue(productivityError);

    // ステップ4: runTx3Imp1Agentを呼び出し
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {});

    // ステップ5: エラーが発生したことを確認
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();

    // ステップ6: executionStatusがfailureであることを確認
    expect(result.executionStatus).toBe('failure');

    // ステップ7: 空配列であることを確認
    expect(result.delayRiskJudgmentResults).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.deliveryResults).toEqual([]);

    // ステップ6,8: errorDetailsにエラー情報が格納
    expect(result.errorDetails.length).toBeGreaterThan(0);
    expect(result.errorDetails[0].errorCode).toBe('DelayRiskMonitoringFailure');
  });

  it('エラーが発生した場合、以降の配置案生成・承認・配信処理は実行されない', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user-004',
      facilityIds: ['facility-004'],
      teamIds: ['team-004'],
      riskThresholdScore: 70,
    };

    // ステップ2: WMS データ取得エラーを返すよう設定
    const dataRetrievalError = new Error('WMS data retrieval failed');
    mockMonitorAndJudgeDelayRisk.mockRejectedValue(dataRetrievalError);

    // ステップ4: runTx3Imp1Agentを呼び出し
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {});

    // ステップ5: monitorAndJudgeDelayRiskが呼ばれたことを確認
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();

    // 以降の処理が呼ばれていないことを確認
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    // ステップ6: executionStatusがfailureであることを確認
    expect(result.executionStatus).toBe('failure');

    // ステップ7,8: 期待結果の検証
    expect(result.delayRiskJudgmentResults).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.deliveryResults).toEqual([]);
    expect(result.errorDetails.length).toBeGreaterThan(0);
    expect(result.errorDetails[0].errorCode).toBe('DelayRiskMonitoringFailure');
    expect(result.errorDetails[0].errorMessage).toContain(
      '進捗遅延リスク監視に失敗しました。リアルタイムデータの取得を確認してください。'
    );
  });
});