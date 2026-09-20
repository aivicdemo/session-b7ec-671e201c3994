import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-618: listWorkersByCondition - ページネーション検証', () => {
  describe('InvalidPaginationError - ページ番号が1未満の場合', () => {
    it('pageNumber = 0のとき、InvalidPaginationErrorが発生する', async () => {
      const input = {
        pageNumber: 0,
        pageSize: 10,
      };

      await expect(listWorkersByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidPaginationError',
          message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
        })
      );
    });

    it('ページ番号が負数のとき、InvalidPaginationErrorが発生する', async () => {
      const input = {
        pageNumber: -1,
        pageSize: 10,
      };

      await expect(listWorkersByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidPaginationError',
          message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
        })
      );
    });

    it('ページ番号がnullのままpageSizeが指定されている場合、正常に処理される（デフォルトページ=1）', async () => {
      const input = {
        pageNumber: undefined,
        pageSize: 10,
      };

      const result = await listWorkersByCondition(input);

      expect(result).toBeDefined();
      expect(result.workers).toBeDefined();
      expect(Array.isArray(result.workers)).toBe(true);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.pageNumber).toBeDefined();
      expect(result.pageSize).toBe(10);
    });
  });

  describe('InvalidPaginationError - ページサイズが不正な場合', () => {
    it('pageSize = 0のとき、InvalidPaginationErrorが発生する', async () => {
      const input = {
        pageNumber: 1,
        pageSize: 0,
      };

      await expect(listWorkersByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidPaginationError',
          message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
        })
      );
    });

    it('pageSize = -1のとき、InvalidPaginationErrorが発生する', async () => {
      const input = {
        pageNumber: 1,
        pageSize: -1,
      };

      await expect(listWorkersByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidPaginationError',
          message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
        })
      );
    });
  });

  describe('正常系 - ページネーション有効な入力', () => {
    it('pageNumber = 1, pageSize = 50で正常に処理される', async () => {
      const input = {
        pageNumber: 1,
        pageSize: 50,
      };

      const result = await listWorkersByCondition(input);

      expect(result).toBeDefined();
      expect(result.workers).toBeDefined();
      expect(Array.isArray(result.workers)).toBe(true);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(50);
      expect(result.retrievedAt).toBeDefined();
    });

    it('ページネーション条件が指定されない場合、デフォルト値で処理される', async () => {
      const input = {
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
        pageSize: undefined,
      };

      const result = await listWorkersByCondition(input);

      expect(result).toBeDefined();
      expect(result.workers).toBeDefined();
      expect(Array.isArray(result.workers)).toBe(true);
      expect(result.retrievedAt).toBeDefined();
    });
  });
});