import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-619: ページサイズが1未満である場合のエラーハンドリング', () => {
  it('pageSize が 0 の場合、InvalidPaginationError をスロー', async () => {
    const input = {
      pageSize: 0,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPaginationError',
        message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
      })
    );
  });
});