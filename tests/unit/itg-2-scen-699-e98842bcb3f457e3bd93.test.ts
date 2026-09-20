import { findComparisonAnalysisResultsByType, FindComparisonAnalysisResultsByTypeInput } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/auth';
import * as dbModule from '../../src/infrastructure/database';

describe('SCEN-699: Database connection error handling for comparison analysis results search', () => {
  beforeEach(() => {
    jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DatabaseQueryError with message "比較分析結果の検索に失敗しました。" when database connection fails', async () => {
    const input: FindComparisonAnalysisResultsByTypeInput = {
      analysisType: '初期割当実績比較',
      sortOrder: 'desc',
      requestingUserId: 'user-001',
    };

    // データベース接続エラーが発生する状態をモック化
    const databaseConnectionError = new Error('Database connection timeout');
    databaseConnectionError.name = 'ConnectionError';

    jest.spyOn(dbModule, 'executeQuery').mockRejectedValueOnce(databaseConnectionError);

    try {
      await findComparisonAnalysisResultsByType(input);
      fail('Expected DatabaseQueryError to be thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('DatabaseQueryError');
      expect((error as Error).message).toBe('比較分析結果の検索に失敗しました。');
      expect((error as any).cause).toBe(databaseConnectionError);
    }
  });
});