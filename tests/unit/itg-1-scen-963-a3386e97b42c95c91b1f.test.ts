import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-963: ListProductivityDataByCondition ソート条件エラー', () => {
  it('ソート順序が ASC でも DESC でもない場合、InvalidSortConditionError が発生する', async () => {
    const input = {
      sortBy: 'productivityRate',
      sortOrder: 'INVALID',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: expect.stringMatching(/InvalidSortConditionError|Error/),
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });

  it('ソート順序が ascending（小文字）の場合、InvalidSortConditionError が発生する', async () => {
    const input = {
      sortBy: 'qualityScore',
      sortOrder: 'ascending',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });

  it('ソート順序が空文字列の場合、InvalidSortConditionError が発生する', async () => {
    const input = {
      sortBy: 'errorCount',
      sortOrder: '',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });

  it('ソート順序が "Asc" や "Desc" 等大文字小文字混在の場合、InvalidSortConditionError が発生する', async () => {
    const input = {
      workDateFrom: '2024-01-01',
      workDateTo: '2024-12-31',
      sortBy: 'workDate',
      sortOrder: 'Asc',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });

  it('ソート順序が数字の場合、InvalidSortConditionError が発生する', async () => {
    const input = {
      minProductivityRate: 50,
      maxProductivityRate: 100,
      sortBy: 'productivityRate',
      sortOrder: '1',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });

  it('他のパラメータが妥当でも、sortOrder だけが不正な場合、InvalidSortConditionError が発生する', async () => {
    const input = {
      workerIds: ['worker-001', 'worker-002'],
      facilityIds: ['facility-001'],
      workDateFrom: '2024-01-01T00:00:00Z',
      workDateTo: '2024-12-31T23:59:59Z',
      sortBy: 'createdAt',
      sortOrder: 'DESCENDING',
      pageNumber: 1,
      pageSize: 100,
    };

    await expect(listProductivityDataByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('ソート条件が不正です'),
      })
    );
  });
});