import { getDelayRiskJudgmentById, saveDelayRiskJudgment, SaveDelayRiskJudgmentInput, GetDelayRiskJudgmentByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-984: 指定されたリスク判定結果IDに対応する進捗遅延リスク判定結果データを検索して返す', () => {
  it('有効なリスク判定結果IDで検索すると、対応するデータが返される', async () => {
    // テスト用データベースに進捗遅延リスク判定結果データを事前登録する
    const workInstructionId = 'work-instruction-test-001';
    const facilityId = 'facility-test-001';
    const teamId = 'team-test-001';
    const judgmentDateTime = '2024-01-15T10:30:00.000Z';
    const riskLevel = 'HIGH';
    const delayPredictionDays = 2;
    const progressRate = 45;
    const plannedProgressRate = 65;
    const judgmentReason = '進捗が計画値から20%遅延しています';
    const recommendedAction = '人員追加配置が必要です';

    // 事前登録用の入力データを準備
    const saveInput: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId,
      facilityId,
      teamId,
      judgmentDateTime,
      riskLevel,
      delayPredictionDays,
      progressRate,
      plannedProgressRate,
      judgmentReason,
      recommendedAction,
      actionStatus: undefined,
      createdBy: 'system-user',
      updatedBy: undefined,
    };

    // データベースに実際に登録する
    const saveResult = await saveDelayRiskJudgment(saveInput);
    expect(saveResult).toBeDefined();
    expect(saveResult.riskJudgmentId).toBeDefined();

    const riskJudgmentId = saveResult.riskJudgmentId;

    // getDelayRiskJudgmentById関数を呼び出す
    // 入力パラメータとして、riskJudgmentIdに事前登録したIDを指定
    const result = await getDelayRiskJudgmentById({
      riskJudgmentId,
    });

    // 関数の戻り値を検証する
    // 出力型GetDelayRiskJudgmentByIdOutputとして、nullではなくデータが返されること
    expect(result).not.toBeNull();
    expect(result).toBeDefined();

    if (result) {
      // 返されたオブジェクトに登録時に設定した情報が含まれていることを確認
      expect(result.riskJudgmentId).toBe(riskJudgmentId);
      expect(result.workInstructionId).toBe(workInstructionId);
      expect(result.facilityId).toBe(facilityId);
      expect(result.teamId).toBe(teamId);
      expect(result.judgmentDateTime).toBe(judgmentDateTime);
      expect(result.riskLevel).toBe(riskLevel);
      expect(result.delayPredictionDays).toBe(delayPredictionDays);
      expect(result.progressRate).toBe(progressRate);
      expect(result.plannedProgressRate).toBe(plannedProgressRate);
      expect(result.judgmentReason).toBe(judgmentReason);
      expect(result.recommendedAction).toBe(recommendedAction);
      expect(result.createdBy).toBe('system-user');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    }
  });
});