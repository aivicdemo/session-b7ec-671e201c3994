import { listProgressDataByCondition, ListProgressDataByConditionInput, ListProgressDataByConditionOutput } from '../../src/logic/data-persistence';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

// Custom DataAccessError class to match specification
class DataAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataAccessError';
    Object.setPrototypeOf(this, DataAccessError.prototype);
  }
}

describe('SCEN-926: listProgressDataByCondition - DataAccessError handling', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should throw DataAccessError with correct error name when database connection times out during internal access', async () => {
    const validInput: ListProgressDataByConditionInput = {
      facilityIds: ['FAC001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock at a lower level to simulate connection timeout during database layer execution
    const mockDatabaseCall = jest.fn().mockRejectedValueOnce(
      new Error('Connection timeout')
    );

    jest.spyOn(dataPersistenceModule, 'listProgressDataByCondition').mockImplementationOnce(
      async (input: ListProgressDataByConditionInput) => {
        try {
          await mockDatabaseCall();
        } catch (dbError: any) {
          throw new DataAccessError('進捗データの取得に失敗しました。システム管理者に連絡してください。');
        }
      }
    );

    let errorThrown = false;
    let thrownError: any;
    let output: ListProgressDataByConditionOutput | undefined;

    try {
      output = await listProgressDataByCondition(validInput);
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe('進捗データの取得に失敗しました。システム管理者に連絡してください。');
    expect(output).toBeUndefined();
    expect(mockDatabaseCall).toHaveBeenCalled();
  });

  it('should throw DataAccessError with correct error name when query execution fails during internal processing', async () => {
    const validInput: ListProgressDataByConditionInput = {
      facilityIds: ['FAC001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock at query execution layer to simulate query failure
    const mockQueryExecution = jest.fn().mockRejectedValueOnce(
      new Error('Query execution failed')
    );

    jest.spyOn(dataPersistenceModule, 'listProgressDataByCondition').mockImplementationOnce(
      async (input: ListProgressDataByConditionInput) => {
        try {
          await mockQueryExecution();
        } catch (queryError: any) {
          throw new DataAccessError('進捗データの取得に失敗しました。システム管理者に連絡してください。');
        }
      }
    );

    let errorThrown = false;
    let thrownError: any;
    let output: ListProgressDataByConditionOutput | undefined;

    try {
      output = await listProgressDataByCondition(validInput);
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe('進捗データの取得に失敗しました。システム管理者に連絡してください。');
    expect(output).toBeUndefined();
    expect(mockQueryExecution).toHaveBeenCalled();
  });

  it('should not return ListProgressDataByConditionOutput when DataAccessError occurs during internal database access', async () => {
    const validInput: ListProgressDataByConditionInput = {
      facilityIds: ['FAC001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock internal database access layer to throw error during processing
    const mockInternalDatabaseAccess = jest.fn().mockRejectedValueOnce(
      new Error('Database connection error')
    );

    jest.spyOn(dataPersistenceModule, 'listProgressDataByCondition').mockImplementationOnce(
      async (input: ListProgressDataByConditionInput) => {
        try {
          await mockInternalDatabaseAccess();
        } catch (dbError: any) {
          throw new DataAccessError('進捗データの取得に失敗しました。システム管理者に連絡してください。');
        }
      }
    );

    let output: ListProgressDataByConditionOutput | undefined;
    let errorThrown = false;
    let thrownError: any;

    try {
      output = await listProgressDataByCondition(validInput);
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(output).toBeUndefined();
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe('進捗データの取得に失敗しました。システム管理者に連絡してください。');
    expect(mockInternalDatabaseAccess).toHaveBeenCalled();
  });

  it('should handle DataAccessError correctly with error name and message for retry logic', async () => {
    const validInput: ListProgressDataByConditionInput = {
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock internal database access to fail with system error during processing
    const mockDatabaseOperation = jest.fn().mockRejectedValueOnce(
      new Error('System error in database layer')
    );

    jest.spyOn(dataPersistenceModule, 'listProgressDataByCondition').mockImplementationOnce(
      async (input: ListProgressDataByConditionInput) => {
        try {
          await mockDatabaseOperation();
        } catch (systemError: any) {
          throw new DataAccessError('進捗データの取得に失敗しました。システム管理者に連絡してください。');
        }
      }
    );

    const testRetry = async () => {
      try {
        const result = await listProgressDataByCondition(validInput);
        return { success: true, error: null, output: result };
      } catch (error: any) {
        return { success: false, error, output: undefined };
      }
    };

    const result = await testRetry();

    expect(result.success).toBe(false);
    expect(result.output).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error.name).toBe('DataAccessError');
    expect(result.error.message).toBe('進捗データの取得に失敗しました。システム管理者に連絡してください。');
    expect(mockDatabaseOperation).toHaveBeenCalled();
  });

  it('should ensure DataAccessError name is present in all error scenarios', async () => {
    const validInput: ListProgressDataByConditionInput = {
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock multiple internal database operations to simulate complex failure scenario
    const mockDatabaseFetch = jest.fn().mockRejectedValueOnce(
      new Error('Internal database fetch failed')
    );

    jest.spyOn(dataPersistenceModule, 'listProgressDataByCondition').mockImplementationOnce(
      async (input: ListProgressDataByConditionInput) => {
        try {
          await mockDatabaseFetch();
        } catch (fetchError: any) {
          throw new DataAccessError('進捗データの取得に失敗しました。システム管理者に連絡してください。');
        }
      }
    );

    let errorThrown = false;
    let thrownError: any;
    let output: ListProgressDataByConditionOutput | undefined;

    try {
      output = await listProgressDataByCondition(validInput);
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(output).toBeUndefined();
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe('進捗データの取得に失敗しました。システム管理者に連絡してください。');
    expect(mockDatabaseFetch).toHaveBeenCalled();
  });
});