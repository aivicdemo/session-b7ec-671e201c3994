import { monitorAndJudgeDelayRisk, MonitorAndJudgeDelayRiskInput, ProductivityDataInsufficientError } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-101: 生産性データ不足時のエラーハンドリング', () => {
  test('生産性データが統計的に有意な分析ができない程度に蓄積不足の場合、ProductivityDataInsufficientErrorを発生させる', async () => {
    // テスト初期化：生産性データが最小件数より少ない状態を確認
    const insufficientProductivityData = Array.from({ length: 5 }, (_, i) => ({
      workerId: `WORKER${i}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      productivity: 80 + Math.random() * 20,
      qualityScore: 85 + Math.random() * 15,
    }));

    // システムが5件の状態で保持されていることを確認
    expect(insufficientProductivityData.length).toBeLessThan(30);
    expect(insufficientProductivityData.length).toBe(5);

    // 入力値を構築
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:00:00Z',
      userId: 'user001',
    };

    // スタブ設定：getLatestProductivityDataByWorker()
    const getLatestProductivityDataByWorkerSpy = jest
      .spyOn(riskEngine as any, 'getLatestProductivityDataByWorker')
      .mockResolvedValue(insufficientProductivityData);

    // スタブ設定：getRecentProgressDataByWorkInstruction()
    const getRecentProgressDataByWorkInstructionSpy = jest
      .spyOn(riskEngine as any, 'getRecentProgressDataByWorkInstruction')
      .mockResolvedValue([
        {
          workInstructionId: 'WI001',
          completionRate: 45,
          plannedProgressRate: 70,
          currentProgressRate: 45,
        },
        {
          workInstructionId: 'WI002',
          completionRate: 60,
          plannedProgressRate: 80,
          currentProgressRate: 60,
        },
      ]);

    // スタブ設定：validateReferentialIntegrity()
    const validateReferentialIntegritySpy = jest
      .spyOn(riskEngine as any, 'validateReferentialIntegrity')
      .mockResolvedValue(true);

    // スタブ設定：calculateRiskScore()
    const calculateRiskScoreSpy = jest
      .spyOn(riskEngine as any, 'calculateRiskScore')
      .mockReturnValue(65);

    // スタブ設定：classifyDelayReason()
    const classifyDelayReasonSpy = jest
      .spyOn(riskEngine as any, 'classifyDelayReason')
      .mockResolvedValue({
        facilityId: 'FAC001',
        teamId: undefined,
        insufficientStaffContribution: 50,
        efficiencyDeclineContribution: 30,
        priorityMisalignmentContribution: 20,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'URGENT',
      });

    // スタブ設定：rankFacilitiesByRiskPriority()
    const rankFacilitiesByRiskPrioritySpy = jest
      .spyOn(riskEngine as any, 'rankFacilitiesByRiskPriority')
      .mockResolvedValue([
        {
          facilityId: 'FAC001',
          facilityName: '東京拠点',
          riskScore: 65,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          priorityRank: 1,
        },
      ]);

    // スタブ設定：calculateDelayRiskScore()
    const calculateDelayRiskScoreSpy = jest
      .spyOn(riskEngine as any, 'calculateDelayRiskScore')
      .mockReturnValue(65);

    // スタブ設定：saveDelayRiskJudgment()
    const saveDelayRiskJudgmentSpy = jest
      .spyOn(riskEngine as any, 'saveDelayRiskJudgment')
      .mockResolvedValue({
        judgmentId: 'JDG001',
        evaluationDateTime: '2024-01-15T10:00:00Z',
        rankedFacilities: [],
        delayReasonClassifications: [],
        recommendedAdjustments: [],
        hasHighRiskFacilities: false,
      });

    // 対象処理を呼び出し
    let thrownError: Error | null = null;
    try {
      await monitorAndJudgeDelayRisk(input);
      fail('ProductivityDataInsufficientErrorが発生すべきでした');
    } catch (error) {
      thrownError = error as Error;
    }

    // 戻り値またはスローされた例外を検証
    expect(thrownError).not.toBeNull();
    expect(thrownError).toBeInstanceOf(ProductivityDataInsufficientError);
    expect(thrownError!.message).toContain('生産性データが不足しています。十分なデータ蓄積後に再試行してください。');

    // 期待結果の検証：呼び出されてはいけない関数が呼び出されていないことを確認
    expect(validateReferentialIntegritySpy).not.toHaveBeenCalled();
    expect(calculateRiskScoreSpy).not.toHaveBeenCalled();
    expect(classifyDelayReasonSpy).not.toHaveBeenCalled();
    expect(rankFacilitiesByRiskPrioritySpy).not.toHaveBeenCalled();
    expect(calculateDelayRiskScoreSpy).not.toHaveBeenCalled();
    expect(saveDelayRiskJudgmentSpy).not.toHaveBeenCalled();

    // スタブのクリーンアップ
    getLatestProductivityDataByWorkerSpy.mockRestore();
    getRecentProgressDataByWorkInstructionSpy.mockRestore();
    validateReferentialIntegritySpy.mockRestore();
    calculateRiskScoreSpy.mockRestore();
    classifyDelayReasonSpy.mockRestore();
    rankFacilitiesByRiskPrioritySpy.mockRestore();
    calculateDelayRiskScoreSpy.mockRestore();
    saveDelayRiskJudgmentSpy.mockRestore();
  });
});