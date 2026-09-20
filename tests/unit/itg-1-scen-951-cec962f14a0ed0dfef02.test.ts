import { getProductivityDataById } from '../../src/logic/data-persistence';

describe('SCEN-951: 空文字列の生産性データIDで取得を試みるとInvalidProductivityDataIdエラーが発生する', () => {
  it('productivityDataIdが空文字列の場合、InvalidProductivityDataIdエラーが発生する', async () => {
    const input = {
      productivityDataId: '',
    };

    await expect(getProductivityDataById(input)).rejects.toThrow('生産性データIDは必須です。');
  });

  it('エラーがInvalidProductivityDataIdである', async () => {
    const input = {
      productivityDataId: '',
    };

    try {
      await getProductivityDataById(input);
      fail('エラーが発生すべき');
    } catch (error: any) {
      expect(error.code || error.name).toBe('InvalidProductivityDataId');
      expect(error.message).toBe('生産性データIDは必須です。');
    }
  });
});