import { getWorkResultById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-718', () => {
  describe('getWorkResultById', () => {
    it('指定された作業実績IDがデータベースに存在しない場合、WorkResultNotFoundエラーを発生させる', async () => {
      const nonExistentWorkResultId = 'WR-999999';

      const call = async () => {
        await getWorkResultById({
          workResultId: nonExistentWorkResultId,
        });
      };

      await expect(call()).rejects.toThrow('Work result with ID WR-999999 not found.');
    });
  });
});