import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン SCEN-1008', () => {
  describe('更新日時の開始が終了より後の場合はエラーを返す', () => {
    it('updatedFromDate が updatedToDate より後の場合、InvalidConditionFormatError をスロー', async () => {
      const input = {
        updatedFromDate: '2024-01-15',
        updatedToDate: '2024-01-10',
      };

      await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow('InvalidConditionFormatError');
    });

    it('エラー文言が正確であることを確認', async () => {
      const input = {
        updatedFromDate: '2024-01-15',
        updatedToDate: '2024-01-10',
      };

      try {
        await listDelayRiskJudgmentByCondition(input);
        fail('エラーがスローされるべき');
      } catch (error: any) {
        expect(error.message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      }
    });
  });
});