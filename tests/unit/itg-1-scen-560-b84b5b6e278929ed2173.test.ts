import { listTeamsByCondition, InvalidConditionError } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-560', () => {
  describe('ListTeamsByCondition: 作成日時の範囲が逆順の場合', () => {
    it('開始日時が終了日時より後の場合、InvalidConditionErrorを返す', async () => {
      const invalidCondition = {
        createdFromDate: '2024-01-15T10:00:00',
        createdToDate: '2024-01-10T09:00:00',
      };

      await expect(listTeamsByCondition(invalidCondition)).rejects.toThrow(InvalidConditionError);

      try {
        await listTeamsByCondition(invalidCondition);
        fail('Should have thrown InvalidConditionError');
      } catch (error) {
        if (error instanceof InvalidConditionError) {
          expect(error.message).toBe('日時範囲が不正です。開始日時は終了日時以前である必要があります。');
          expect(error.name).toBe('InvalidConditionError');
        } else {
          throw error;
        }
      }
    });
  });
});