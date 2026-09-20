import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1120: WMS連携ログ検索条件の日時範囲バリデーション', () => {
  describe('レコード作成日の開始が終了より後の場合', () => {
    it('InvalidSearchConditionError が発生し、エラー文言が正しいこと', async () => {
      const invalidCondition = {
        createdFromDate: '2024-01-15T10:00:00Z',
        createdToDate: '2024-01-10T10:00:00Z',
      };

      await expect(
        listWmsSyncLogByCondition(invalidCondition)
      ).rejects.toMatchObject({
        name: 'InvalidSearchConditionError',
        message: '検索条件が無効です。日時範囲またはページサイズを確認してください。',
      });
    });
  });
});