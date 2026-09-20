import { getProgressDataById } from '../../src/logic/data-persistence';

describe('進捗データIDが空文字列の場合、InvalidProgressDataIdエラーが発生する', () => {
  it('空文字列のprogressDataIdでエラーが発生する', async () => {
    const input = {
      progressDataId: '',
    };

    await expect(getProgressDataById(input)).rejects.toThrow('進捗データIDは必須です。');
  });
});