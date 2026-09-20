import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-538', () => {
  describe('listFacilitiesByCondition - 数値範囲検証エラーケース', () => {
    it('最小収容人員数が最大値より大きい場合、InvalidSearchConditionErrorを発生させる', async () => {
      const input = {
        minCapacity: 100,
        maxCapacity: 50,
      };

      await expect(
        listFacilitiesByCondition(input)
      ).rejects.toThrow();

      try {
        await listFacilitiesByCondition(input);
        fail('例外が発生すべき');
      } catch (error: any) {
        expect(error.name).toBe('InvalidSearchConditionError');
        expect(error.message).toContain('検索条件が不正です');
        expect(error.message).toContain('日時範囲と数値範囲を確認してください');
      }
    });
  });
});