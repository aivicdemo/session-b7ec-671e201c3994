import { listTeamsByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-561: 更新日時の範囲が逆順の場合、InvalidConditionErrorを返す', () => {
    it('updatedFromDate が updatedToDate より後の場合、InvalidConditionError を返す', async () => {
      const input = {
        updatedFromDate: '2024-01-15T10:00:00',
        updatedToDate: '2024-01-10T09:00:00',
      };

      await expect(listTeamsByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidConditionError',
          message: expect.stringContaining(
            '日時範囲が不正です。開始日時は終了日時以前である必要があります。'
          ),
        })
      );
    });
  });
});