import { getProductivityDataById } from '../../src/logic/data-persistence';

describe('SCEN-953: getProductivityDataById - undefinedの生産性データIDで取得を試みるとエラーが発生する', () => {
  it('productivityDataId に undefined を指定して呼び出すと、InvalidProductivityDataId エラーが発生し、エラーメッセージが「生産性データIDは必須です。」である', async () => {
    const undefinedId = undefined as any;

    await expect(getProductivityDataById({ productivityDataId: undefinedId })).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProductivityDataId',
        message: '生産性データIDは必須です。'
      })
    );
  });
});