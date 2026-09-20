import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-960: ページ番号が1未満の場合、ページネーションエラーが発生する', () => {
  it('pageNumber が 0 の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      pageNumber: 0,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
    );
  });

  it('pageNumber が -1 の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      pageNumber: -1,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
    );
  });

  it('pageNumber が負の大きな値の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      pageNumber: -100,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
    );
  });

  it('pageNumber が 0 で pageSize も 0 以下の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      pageNumber: 0,
      pageSize: 0,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
    );
  });

  it('pageNumber が 1 未満で他の検索条件が指定されている場合、InvalidPaginationError が発生する', async () => {
    const input = {
      workerIds: ['worker-123'],
      facilityIds: ['facility-456'],
      workDateFrom: '2024-01-01',
      pageNumber: 0,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。'
    );
  });
});