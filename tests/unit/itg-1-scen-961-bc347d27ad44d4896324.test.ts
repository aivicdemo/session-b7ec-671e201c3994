import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-961: ページサイズが1未満の場合、ページネーションエラーが発生する', () => {
  it('pageSize が 0 の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 0,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPaginationError',
        message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
      })
    );
  });

  it('pageSize が負数の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: -5,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPaginationError',
        message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
      })
    );
  });

  it('pageNumber が 0 の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 0,
      pageSize: 10,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPaginationError',
        message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
      })
    );
  });

  it('pageNumber と pageSize 両方が不正な場合、InvalidPaginationError が発生する', async () => {
    const input = {
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 0,
      pageSize: -1,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPaginationError',
        message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
      })
    );
  });
});