import { listTeamsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-562: listTeamsByCondition - ページ番号が1未満の場合', () => {
  it('ページ番号が0の場合、InvalidPaginationErrorを返す', async () => {
    const input = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 0,
      pageSize: 10,
    };

    try {
      await listTeamsByCondition(input);
      fail('InvalidPaginationErrorが発生すべきでした');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidPaginationError');
      expect(error.message).toBe(
        'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
      );
    }
  });

  it('ページ番号が負数の場合、InvalidPaginationErrorを返す', async () => {
    const input = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: -1,
      pageSize: 10,
    };

    try {
      await listTeamsByCondition(input);
      fail('InvalidPaginationErrorが発生すべきでした');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidPaginationError');
      expect(error.message).toBe(
        'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
      );
    }
  });
});