import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-747: listWorkResultsByCondition - ページネーション条件検証', () => {
  it('ページ番号が1未満の場合、InvalidPaginationErrorが発生する', async () => {
    const input = {
      pageNumber: 0,
    };

    await expect(listWorkResultsByCondition(input)).rejects.toThrow('ページネーション条件が不正です。');
  });
});