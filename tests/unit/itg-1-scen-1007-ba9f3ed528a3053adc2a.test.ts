import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-1007', () => {
  describe('listDelayRiskJudgmentByCondition', () => {
    test('作成日時の開始が終了より後の場合はエラーを返す', async () => {
      const input = {
        riskJudgmentIds: undefined,
        workInstructionIds: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        riskLevels: undefined,
        actionStatuses: undefined,
        minDelayPredictionDays: undefined,
        maxDelayPredictionDays: undefined,
        minProgressRate: undefined,
        maxProgressRate: undefined,
        judgmentDateFromDateTime: undefined,
        judgmentDateToDateTime: undefined,
        createdFromDate: '2024-12-31',
        createdToDate: '2024-12-25',
        updatedFromDate: undefined,
        updatedToDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      };

      await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidConditionFormatError',
          message: '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。',
        })
      );
    });
  });
});