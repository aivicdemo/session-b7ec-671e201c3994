import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
} from '../../src/agents/tx-3-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-3-imp-1/services/authorization');
jest.mock('../../src/agents/tx-3-imp-1/services/delay-risk-monitoring');
jest.mock('../../src/agents/tx-3-imp-1/services/allocation-planning');
jest.mock('../../src/agents/tx-3-imp-1/services/delivery');

import { authorizeOperation } from '../../src/agents/tx-3-imp-1/services/authorization';
import { monitorAndJudgeDelayRisk } from '../../src/agents/tx-3-imp-1/services/delay-risk-monitoring';
import { generateAllocationPlan } from '../../src/agents/tx-3-imp-1/services/allocation-planning';
import { deliverAllocationPlanAndWorkInstructions } from '../../src/agents/tx-3-imp-1/services/delivery';

const mockAuthorizeOperation = authorizeOperation as jest.MockedFunction<typeof authorizeOperation>;
const mockMonitorAndJudgeDelayRisk = monitorAndJudgeDelayRisk as jest.MockedFunction<typeof monitorAndJudgeDelayRisk>;
const mockGenerateAllocationPlan = generateAllocationPlan as jest.MockedFunction<typeof generateAllocationPlan>;
const mockDeliverAllocationPlanAndWorkInstructions = deliverAllocationPlanAndWorkInstructions as jest.MockedFunction<typeof deliverAllocationPlanAndWorkInstructions>;

describe('SCEN-056: エラー系：遅延リスク判定失敗時に部分成功状態で現場リーダーへの配信が実行されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('遅延リスク判定失敗時に部分成功状態で現場リーダーへの配信が実行されない', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['fac-A'],
      teamIds: ['team-1'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    // authorizeOperation スタブ：権限ありで応答
    mockAuthorizeOperation.mockResolvedValue({
      authorized: true,
      userId: 'user-001',
    });

    // monitorAndJudgeDelayRisk スタブ：DelayRiskMonitoringFailure エラーを発生させる
    const delayRiskError = new Error('進捗遅延リスク監視に失敗しました。リアルタイムデータの取得を確認してください。');
    (delayRiskError as any).code = 'DelayRiskMonitoringFailure';
    mockMonitorAndJudgeDelayRisk.mockRejectedValue(delayRiskError);

    // Act
    let exceptionCaught = false;
    let result: Tx3Imp1AgentOutput;
    try {
      result = await runTx3Imp1Agent(input, {
        authorizeOperation: mockAuthorizeOperation,
        monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
        generateAllocationPlan: mockGenerateAllocationPlan,
        deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      } as any);
    } catch (error) {
      exceptionCaught = true;
      throw error;
    }

    // Assert - エラーハンドリングロジックが実行されたことを検証
    expect(exceptionCaught).toBe(false);
    expect(result).toBeDefined();

    // 部分成功状態の確認
    expect(result.executionStatus).toBe('partial_success');

    // リスク判定前段階なので、これらのフィールドが生成されていないことを確認
    expect(result.delayRiskJudgmentResults).toEqual([]);
    expect(result.generatedAllocationPlans).toEqual([]);
    expect(result.approvalStatus).toBeUndefined();
    expect(result.deliveryResults).toEqual([]);

    // errorDetails に DelayRiskMonitoringFailure のエラーオブジェクトが格納されていることを確認
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails[0].errorCode).toBe('DelayRiskMonitoringFailure');
    expect(result.errorDetails[0].errorMessage).toBe(
      '進捗遅延リスク監視に失敗しました。リアルタイムデータの取得を確認してください。'
    );
    expect(result.errorDetails[0].affectedFacilityId).toBe('fac-A');
    expect(result.errorDetails[0].affectedTeamId).toBe('team-1');
    expect(result.errorDetails[0].errorTimestamp).toBeDefined();

    // executionId と executionTimestamp は生成されていることを確認
    expect(result.executionId).toBeDefined();
    expect(result.executionTimestamp).toBeDefined();

    // 配置案生成サービスが呼び出されていないことを確認（リスク判定失敗のため）
    expect(mockGenerateAllocationPlan).not.toHaveBeenCalled();

    // deliverAllocationPlanAndWorkInstructions が呼び出されないことを確認
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    // monitorAndJudgeDelayRisk が呼び出されていることを確認
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
  });
});