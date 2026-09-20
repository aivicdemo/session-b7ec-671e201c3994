import { getProductivityDataById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-952', () => {
  describe('getProductivityDataById - nullの生産性データIDでのエラーハンドリング', () => {
    it('nullの生産性データIDで取得を試みると、InvalidProductivityDataIdエラーが発生する', async () => {
      const input = {
        productivityDataId: null as any,
      };

      try {
        await getProductivityDataById(input);
        fail('エラーが発生するべきでした');
      } catch (error: any) {
        expect(error.name).toBe('InvalidProductivityDataIdError');
        expect(error.message).toBe('生産性データIDは必須です。');
      }
    });
  });
});