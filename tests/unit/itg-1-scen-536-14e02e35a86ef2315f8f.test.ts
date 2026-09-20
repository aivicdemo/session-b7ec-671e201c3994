import { listFacilitiesByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-536', () => {
  describe('listFacilitiesByCondition', () => {
    it('創作日時の開始日時が終了日時より後の場合、エラーを返す', async () => {
      const input = {
        createdFromDate: '2024-01-15T10:00:00Z',
        createdToDate: '2024-01-10T15:00:00Z',
      };

      await expect(listFacilitiesByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('検索条件が不正です。日時範囲と数値範囲を確認してください。'),
        }),
      );
    });
  });
});