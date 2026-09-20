import {
  listDelayRiskJudgmentByCondition,
  ListDelayRiskJudgmentByConditionInput,
} from '../../src/logic/data-persistence';

describe('SCEN-1012: listDelayRiskJudgmentByCondition - 存在しない拠点IDを指定した場合', () => {
  it('should throw ReferentialIntegrityError when non-existent facilityIds are specified', async () => {
    // 入力パラメータを準備する。facilityIds に実在しない拠点IDを指定
    const input: ListDelayRiskJudgmentByConditionInput = {
      facilityIds: ['FACILITY_NONEXISTENT_12345'],
      riskJudgmentIds: null,
      workInstructionIds: null,
      teamIds: null,
      riskLevels: null,
      actionStatuses: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // listDelayRiskJudgmentByCondition 関数を呼び出す
    try {
      await listDelayRiskJudgmentByCondition(input);
      // エラーが発生しなかった場合、テスト失敗
      fail('Expected ReferentialIntegrityError to be thrown');
    } catch (error: unknown) {
      // ReferentialIntegrityError が発生することを確認
      const errorObj = error as Record<string, unknown>;
      expect(errorObj.name).toBe('ReferentialIntegrityError');
      expect(errorObj.message).toBe(
        '指定された拠点・チーム・作業指示が見つかりません。'
      );
    }
  });

  it('should not throw InvalidConditionFormatError when non-existent facilityIds are specified', async () => {
    const input: ListDelayRiskJudgmentByConditionInput = {
      facilityIds: ['FACILITY_NONEXISTENT_12345'],
      riskJudgmentIds: null,
      workInstructionIds: null,
      teamIds: null,
      riskLevels: null,
      actionStatuses: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    try {
      await listDelayRiskJudgmentByCondition(input);
      fail('Expected ReferentialIntegrityError to be thrown');
    } catch (error: unknown) {
      const errorObj = error as Record<string, unknown>;
      // InvalidConditionFormatError は発生しないことを確認
      expect(errorObj.name).not.toBe('InvalidConditionFormatError');
      // ReferentialIntegrityError のみが返却されること
      expect(errorObj.name).toBe('ReferentialIntegrityError');
    }
  });
});