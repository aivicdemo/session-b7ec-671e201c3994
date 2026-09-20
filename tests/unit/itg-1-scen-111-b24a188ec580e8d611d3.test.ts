import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as progressMonitoringModule from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-111: 進捗遅延リスク判定エンジン - 作業者数0時の例外発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('現在の作業者数が0のとき、例外を発生させて人員配置の確認を促す', async () => {
    // テスト入力値を準備
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER123',
    };

    // WMS進捗データ取得をスタブ化
    const getRecentProgressDataByWorkInstructionSpy = jest
      .spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any)
      .mockResolvedValue([
        {
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          completedQuantity: 50,
          remainingQuantity: 50,
          progressRate: 50,
        },
      ]);

    // 作業者生産性データ取得をスタブ化（FAC001の作業者配置数を0に設定）
    const getLatestProductivityDataByWorkerSpy = jest
      .spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any)
      .mockResolvedValue([]);

    // validateReferentialIntegrity をスタブ化
    const validateReferentialIntegritySpy = jest
      .spyOn(progressMonitoringModule, 'validateReferentialIntegrity' as any)
      .mockResolvedValue({ isValid: true, issues: [] });

    // calculateDelayRiskScore をスタブ化
    const calculateDelayRiskScoreSpy = jest
      .spyOn(progressMonitoringModule, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({
        facilityId: 'FAC001',
        riskScore: 0,
        predictedDelayDays: 0,
      });

    // classifyDelayReason をスタブ化
    const classifyDelayReasonSpy = jest
      .spyOn(progressMonitoringModule, 'classifyDelayReason' as any)
      .mockResolvedValue({
        facilityId: 'FAC001',
        insufficientStaffContribution: 0,
        efficiencyDeclineContribution: 0,
        priorityMisalignmentContribution: 0,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
      });

    // rankFacilitiesByRiskPriority をスタブ化
    const rankFacilitiesByRiskPrioritySpy = jest
      .spyOn(progressMonitoringModule, 'rankFacilitiesByRiskPriority' as any)
      .mockResolvedValue({
        rankedFacilities: [],
      });

    // saveDelayRiskJudgment をスタブ化
    const saveDelayRiskJudgmentSpy = jest
      .spyOn(progressMonitoringModule, 'saveDelayRiskJudgment' as any)
      .mockResolvedValue(undefined);

    // monitorAndJudgeDelayRisk を呼び出して例外が発生することを検証
    let thrownError: Error | undefined;
    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // 例外がスローされたことを確認
    expect(thrownError).toBeDefined();

    // 例外メッセージを確認
    expect(thrownError?.message).toBe(
      '作業者が配置されていません。人員配置を確認してください'
    );

    // 例外型が業務ルール br-tx_4-003 に基づいた入力値検証エラーであることを確認
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError?.name).toBeDefined();

    // 例外が入力値検証段階で発生し、判定結果を出力できない旨を示していることを確認
    expect(thrownError?.message).toContain('作業者が配置されていません');

    // スタブ化された呼び出し先関数が呼び出されないことを検証
    expect(calculateDelayRiskScoreSpy).not.toHaveBeenCalled();
    expect(classifyDelayReasonSpy).not.toHaveBeenCalled();
    expect(rankFacilitiesByRiskPrioritySpy).not.toHaveBeenCalled();
    expect(saveDelayRiskJudgmentSpy).not.toHaveBeenCalled();
  });
});