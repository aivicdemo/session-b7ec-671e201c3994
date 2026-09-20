import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-668: listProficienciesByCondition - ページサイズが1未満の場合', () => {
  it('ページサイズが0の場合、InvalidPaginationErrorが発生する', async () => {
    const input = {
      pageSize: 0,
    };

    await expect(listProficienciesByCondition(input)).rejects.toMatchObject({
      name: 'InvalidPaginationError',
      message: expect.stringContaining('ページ番号とページサイズは1以上である必要があります'),
    });
  });
});