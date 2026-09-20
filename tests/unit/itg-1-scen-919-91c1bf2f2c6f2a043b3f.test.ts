import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-919: listProgressDataByCondition - 完了率の範囲外チェック', () => {
  it('minCompletionRate が -1 の場合、InvalidCompletionRateRange エラーを返す', async () => {
    const input = {
      minCompletionRate: -1,
    };

    await expect(listProgressDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        code: 'InvalidCompletionRateRange',
        message: '完了率の範囲が不正です。0～100の値を指定してください。',
      })
    );
  });
});