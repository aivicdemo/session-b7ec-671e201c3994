import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-1006: 判定日時の開始が終了より後の場合はエラーを返す', () => {
    it('judgmentDateFromDateTime が judgmentDateToDateTime より後の場合、InvalidConditionFormatError をスロー', async () => {
      const input = {
        judgmentDateFromDateTime: '2024-01-20T10:00:00Z',
        judgmentDateToDateTime: '2024-01-15T18:00:00Z',
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
        createdFromDate: undefined,
        createdToDate: undefined,
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