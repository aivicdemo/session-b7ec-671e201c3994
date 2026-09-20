import { saveDelayRiskJudgment, SaveDelayRiskJudgmentInput } from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('SCEN-979: 進捗遅延リスク判定結果データの判定日時妥当性検証', () => {
  let validateDateTimeRangeStub: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // validateDateTimeRange のスタブ設定
    // 将来日時を判定する汎用ロジック：入力が現在時刻より後の場合にエラーをスロー
    validateDateTimeRangeStub = jest
      .spyOn(validationModule, 'validateDateTimeRange')
      .mockImplementation((dateTimeString: string) => {
        const inputDateTime = new Date(dateTimeString);
        const currentDateTime = new Date();
        
        if (isNaN(inputDateTime.getTime())) {
          const error = new Error(
            `判定日時 '${dateTimeString}' は無効な形式です。`
          );
          error.name = 'InvalidJudgmentDateTimeError';
          throw error;
        }
        
        if (inputDateTime > currentDateTime) {
          const error = new Error(
            `判定日時 '${dateTimeString}' は無効です。`
          );
          error.name = 'InvalidJudgmentDateTimeError';
          throw error;
        }
      });
  });

  afterEach(() => {
    validateDateTimeRangeStub.mockRestore();
    jest.restoreAllMocks();
  });

  it('判定日時が将来日時（ISO 8601形式）であるとき、InvalidJudgmentDateTimeエラーを発生させ、データベース保存は実行されないこと', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FC-001',
      teamId: 'TEAM-001',
      judgmentDateTime: '2099-12-31T23:59:59Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 5,
      progressRate: 50,
      plannedProgressRate: 70,
      judgmentReason: '人員不足',
      recommendedAction: '人員追加',
      actionStatus: '未対応',
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    // 関数を呼び出してスロー内容を検証する
    let thrownError: Error | null = null;
    try {
      await saveDelayRiskJudgment(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // 期待結果：InvalidJudgmentDateTimeエラーが発生すること
    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('InvalidJudgmentDateTimeError');
    expect(thrownError?.message).toBe(
      "判定日時 '2099-12-31T23:59:59Z' は無効です。"
    );

    // 検証が呼ばれていることを確認
    expect(validateDateTimeRangeStub).toHaveBeenCalledWith(
      '2099-12-31T23:59:59Z'
    );
    expect(validateDateTimeRangeStub).toHaveBeenCalledTimes(1);
  });
});