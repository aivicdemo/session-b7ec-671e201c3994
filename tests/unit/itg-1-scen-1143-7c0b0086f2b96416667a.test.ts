import { deleteDataByConditionAndType, PersistenceError } from '../../src/logic/data-persistence';

describe('SCEN-1143: deleteDataByConditionAndType - PersistenceError on database connection failure', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should throw PersistenceError with correct message when database connection is interrupted', async () => {
    const input = {
      dataType: 'worker',
      filterCondition: { id: 'WORKER-001' },
      deletedBy: 'admin-user-001',
    };

    fetchSpy.mockRejectedValueOnce(
      new Error('Database connection refused')
    );

    let thrownError: unknown;
    try {
      await deleteDataByConditionAndType(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(PersistenceError);
    expect((thrownError as PersistenceError).message).toBe(
      'データベース操作に失敗しました。しばらく後に再度お試しください。'
    );
  });

  it('should throw PersistenceError with correct message when transaction lock conflict occurs', async () => {
    const input = {
      dataType: 'worker',
      filterCondition: { id: 'WORKER-001' },
      deletedBy: 'admin-user-001',
    };

    fetchSpy.mockRejectedValueOnce(
      new Error('Transaction lock conflict')
    );

    let thrownError: unknown;
    try {
      await deleteDataByConditionAndType(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(PersistenceError);
    expect((thrownError as PersistenceError).message).toBe(
      'データベース操作に失敗しました。しばらく後に再度お試しください。'
    );
  });

  it('should not return DeleteDataByConditionAndTypeOutput when PersistenceError is thrown', async () => {
    const input = {
      dataType: 'worker',
      filterCondition: { id: 'WORKER-001' },
      deletedBy: 'admin-user-001',
    };

    fetchSpy.mockRejectedValueOnce(
      new Error('Database connection refused')
    );

    const result = deleteDataByConditionAndType(input);
    
    await expect(result).rejects.toThrow(PersistenceError);
  });
});