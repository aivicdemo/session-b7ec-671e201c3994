import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authModule from '../../src/auth/auth-authorization-audit';
import * as riskEngineModule from '../../src/progress-monitoring-risk-engine';
import * as allocationApprovalModule from '../../src/allocation-plan-review-approval';
import * as deliveryModule from '../../src/work-instruction-delivery-manager';

// テスト用のカスタムエラークラス
class DelayDetectionFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DelayDetectionFailureError';
  }
}

describe('SCEN-003: エラー系：遅延リスク判定エンジンの実行に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DelayDetectionFailureErrorが発生し、以降の処理は実行されず、出力フィールドが返却されない', async () => {
    // Step 1: テスト用のモックユーザー、拠点、チームを準備
    const testInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A'],
      targetTeamIds: ['team-1'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    // Step 2: authorizeOperationをスタブ化し、正常に権限検証を通す
    jest.spyOn(authModule, 'authorizeOperation').mockResolvedValue(undefined);

    // Step 3: monitorAndJudgeDelayRiskをスタブ化し、エラーを発生させる
    const delayDetectionError = new DelayDetectionFailureError(
      '遅延リスク判定に失敗しました。システム管理者に報告してください。'
    );
    jest
      .spyOn(riskEngineModule, 'monitorAndJudgeDelayRisk')
      .mockRejectedValue(delayDetectionError);

    // 以降の処理が呼び出されていないことを確認するためのスパイ
    const judgeAllocationPlanSpy = jest.spyOn(
      allocationApprovalModule,
      'judgeAllocationPlanApprovalWithCriteria'
    );
    const deliverAllocationPlanSpy = jest.spyOn(
      deliveryModule,
      'deliverAllocationPlanAndWorkInstructions'
    );

    // Step 4: runTx1Imp1Agentを呼び出す
    let thrownError: Error | undefined;
    let result: any;

    try {
      result = await runTx1Imp1Agent(testInput, {
        authorizeOperation: authModule.authorizeOperation,
        monitorAndJudgeDelayRisk: riskEngineModule.monitorAndJudgeDelayRisk,
        judgeAllocationPlanApprovalWithCriteria:
          allocationApprovalModule.judgeAllocationPlanApprovalWithCriteria,
        deliverAllocationPlanAndWorkInstructions:
          deliveryModule.deliverAllocationPlanAndWorkInstructions,
      });
    } catch (error) {
      thrownError = error as Error;
    }

    // Step 5: エラーがスローされることを検証
    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('DelayDetectionFailureError');
    expect(thrownError?.message).toBe(
      '遅延リスク判定に失敗しました。システム管理者に報告してください。'
    );

    // 以降の処理が呼び出されていないことを確認
    expect(judgeAllocationPlanSpy).not.toHaveBeenCalled();
    expect(deliverAllocationPlanSpy).not.toHaveBeenCalled();

    // monitorAndJudgeDelayRiskが1回呼び出されたことを確認
    expect(riskEngineModule.monitorAndJudgeDelayRisk).toHaveBeenCalledTimes(1);

    // エラー発生時、結果は返却されないことを確認
    expect(result).toBeUndefined();

    // 出力フィールドが返却されていないことを確認
    // executionId、executionStatus、delayDetectionResult、
    // generatedAllocationPlans、approvedAllocationPlans、deliveryResultsは返却されない
    if (result) {
      expect(result.executionId).toBeUndefined();
      expect(result.executionStatus).toBeUndefined();
      expect(result.delayDetectionResult).toBeUndefined();
      expect(result.generatedAllocationPlans).toBeUndefined();
      expect(result.approvedAllocationPlans).toBeUndefined();
      expect(result.deliveryResults).toBeUndefined();
    }
  });
});