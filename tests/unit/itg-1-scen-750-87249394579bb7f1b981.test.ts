import { listWorkResultsByCondition, ListWorkResultsByConditionInput } from '../../src/logic/data-persistence';

// Mock at module level before any test execution
jest.mock('../../src/infrastructure/database', () => ({
  getDatabase: jest.fn(),
}));

describe('SCEN-750: listWorkResultsByCondition - クエリ実行エラー発生時にデータアクセスエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataAccessError when database connection fails', async () => {
    // Arrange
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['worker-001', 'worker-002'],
      pageNumber: 1,
      pageSize: 50,
    };

    const mockDatabaseError = new Error('Database connection failed');
    const mockDatabaseClient = {
      query: jest.fn().mockRejectedValueOnce(mockDatabaseError),
    };

    const { getDatabase } = require('../../src/infrastructure/database');
    getDatabase.mockReturnValue(mockDatabaseClient);

    // Act & Assert
    const error = await listWorkResultsByCondition(input).catch((err: any) => err);

    // Verify DataAccessError is thrown with correct message
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DataAccessError');
    expect(error.message).toBe('作業実績データの取得に失敗しました。');

    // Verify that output fields are not returned
    expect(error).not.toHaveProperty('workResults');
    expect(error).not.toHaveProperty('totalCount');
    expect(error).not.toHaveProperty('pageNumber');
    expect(error).not.toHaveProperty('pageSize');
    expect(error).not.toHaveProperty('retrievedAt');
  });

  it('should throw DataAccessError when query execution fails', async () => {
    // Arrange
    const input: ListWorkResultsByConditionInput = {
      workerIds: ['worker-001'],
      pageNumber: 1,
      pageSize: 50,
    };

    const mockQueryError = new Error('Query execution timeout');
    const mockDatabaseClient = {
      query: jest.fn().mockRejectedValueOnce(mockQueryError),
    };

    const { getDatabase } = require('../../src/infrastructure/database');
    getDatabase.mockReturnValue(mockDatabaseClient);

    // Act & Assert
    const error = await listWorkResultsByCondition(input).catch((err: any) => err);

    // Verify DataAccessError is thrown with correct message
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DataAccessError');
    expect(error.message).toBe('作業実績データの取得に失敗しました。');

    // Verify that output fields are not returned
    expect(error).not.toHaveProperty('workResults');
    expect(error).not.toHaveProperty('totalCount');
    expect(error).not.toHaveProperty('pageNumber');
    expect(error).not.toHaveProperty('pageSize');
    expect(error).not.toHaveProperty('retrievedAt');
  });
});