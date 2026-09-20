import { listWorkersByCondition } from '../../src/logic/data-persistence';
import { ListWorkersByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-621: sortOrderが\'ASC\'と\'DESC\'以外の値である場合、InvalidSortParameterErrorが発生する', () => {
  it('sortOrderが無効な値の場合、InvalidSortParameterErrorが発生する', async () => {
    const input: ListWorkersByConditionInput = {
      sortBy: 'workerName',
      sortOrder: 'INVALID',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: 'ソート条件が不正です。指定されたフィールドまたはソート順序が無効です。',
      })
    );
  });

  it('sortOrderが小文字の\'asc\'の場合、InvalidSortParameterErrorが発生する', async () => {
    const input: ListWorkersByConditionInput = {
      sortBy: 'workerName',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: 'ソート条件が不正です。指定されたフィールドまたはソート順序が無効です。',
      })
    );
  });

  it('sortOrderが小文字の\'desc\'の場合、InvalidSortParameterErrorが発生する', async () => {
    const input: ListWorkersByConditionInput = {
      sortBy: 'workerName',
      sortOrder: 'desc',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: 'ソート条件が不正です。指定されたフィールドまたはソート順序が無効です。',
      })
    );
  });

  it('sortOrderが任意の文字列の場合、InvalidSortParameterErrorが発生する', async () => {
    const input: ListWorkersByConditionInput = {
      sortBy: 'workerName',
      sortOrder: 'random-value',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSortParameterError',
        message: 'ソート条件が不正です。指定されたフィールドまたはソート順序が無効です。',
      })
    );
  });

  it('sortOrderが無効な値の場合、ListWorkersByConditionOutputは返却されない', async () => {
    const input: ListWorkersByConditionInput = {
      sortBy: 'workerName',
      sortOrder: 'UNKNOWN',
      pageNumber: 1,
      pageSize: 50,
    };

    try {
      await listWorkersByCondition(input);
      fail('Should have thrown InvalidSortParameterError');
    } catch (error) {
      expect(error).toHaveProperty('name', 'InvalidSortParameterError');
      expect(error).not.toHaveProperty('workers');
      expect(error).not.toHaveProperty('totalCount');
      expect(error).not.toHaveProperty('retrievedAt');
    }
  });
});