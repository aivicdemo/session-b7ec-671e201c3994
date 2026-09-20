import { listWorkersByCondition, ListWorkersByConditionInput, ListWorkersByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-623: listWorkersByCondition - クエリ実行エラーが発生した場合、DataRetrievalErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DataRetrievalError when database query execution fails', async () => {
    const validSearchCondition: ListWorkersByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(listWorkersByCondition(validSearchCondition)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalError',
        message: '作業者データの取得に失敗しました。システム管理者に連絡してください。',
      })
    );
  });

  it('should throw DataRetrievalError with correct error message on SQL execution error', async () => {
    const validSearchCondition: ListWorkersByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await listWorkersByCondition(validSearchCondition);
      fail('Expected DataRetrievalError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('DataRetrievalError');
      expect(error.message).toBe('作業者データの取得に失敗しました。システム管理者に連絡してください。');
    }
  });

  it('should not return ListWorkersByConditionOutput when error occurs', async () => {
    const validSearchCondition: ListWorkersByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    let outputReturned = false;
    try {
      await listWorkersByCondition(validSearchCondition);
      outputReturned = true;
      fail('Expected DataRetrievalError to be thrown, but function returned a result');
    } catch (error: any) {
      expect(outputReturned).toBe(false);
      expect(error.name).toBe('DataRetrievalError');
      expect(error.message).toContain('作業者データの取得に失敗しました。システム管理者に連絡してください。');
    }
  });

  it('should handle database timeout error and convert to DataRetrievalError', async () => {
    const validSearchCondition: ListWorkersByConditionInput = {
      facilityIds: ['F001'],
      teamIds: ['T001'],
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(listWorkersByCondition(validSearchCondition)).rejects.toThrow(
      expect.objectContaining({
        name: 'DataRetrievalError',
        message: '作業者データの取得に失敗しました。システム管理者に連絡してください。',
      })
    );
  });

  it('should not return any output on query execution error', async () => {
    const validSearchCondition: ListWorkersByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    let capturedResult: ListWorkersByConditionOutput | undefined;
    try {
      capturedResult = await listWorkersByCondition(validSearchCondition);
      fail('Expected DataRetrievalError to be thrown');
    } catch (error: any) {
      expect(capturedResult).toBeUndefined();
      expect(error.name).toBe('DataRetrievalError');
      expect(error.message).toBe('作業者データの取得に失敗しました。システム管理者に連絡してください。');
    }
  });

  it('should throw DataRetrievalError on SQL statement execution error', async () => {
    const validSearchCondition: ListWorkersByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    try {
      await listWorkersByCondition(validSearchCondition);
      fail('Expected DataRetrievalError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('DataRetrievalError');
      expect(error.message).toBe('作業者データの取得に失敗しました。システム管理者に連絡してください。');
    }
  });
});