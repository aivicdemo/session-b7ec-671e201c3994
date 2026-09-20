import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1052: ページネーション条件エラーの検証', () => {
  it('ページ番号が1未満の場合、InvalidPaginationErrorが発生する', async () => {
    const input = {
      pageNumber: 0,
      pageSize: 10,
    };

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toThrow('ページネーション条件が不正です。');
  });
});