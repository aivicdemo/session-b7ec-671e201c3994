import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-921: listProgressDataByConditionエラーハンドリング', () => {
  it('実績数量の最小値が最大値より大きい場合、InvalidQuantityRangeエラーを返す', async () => {
    const input = {
      minActualQuantity: 150,
      maxActualQuantity: 100,
    };

    try {
      await listProgressDataByCondition(input);
      fail('エラーが発生すべきですが、正常に完了しました');
    } catch (error: any) {
      expect(error.name).toBe('InvalidQuantityRangeError');
      expect(error.message).toContain('実績数量の範囲が不正です。最小値は最大値以下である必要があります。');
    }
  });
});