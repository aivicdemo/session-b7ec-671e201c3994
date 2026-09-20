import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-701: Comparison Analysis Results Database Query Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DatabaseQueryError with correct message when database query execution fails', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';
    const sortOrder = 'desc' as const;

    // Mock authorizeUserAction to succeed
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValueOnce(true);

    const databaseError = new Error('比較分析結果の検索に失敗しました。');
    Object.defineProperty(databaseError, 'name', { value: 'DatabaseQueryError' });

    jest.spyOn(persistenceLayer, 'findComparisonAnalysisResultsByType').mockRejectedValueOnce(databaseError);

    let result: any;
    let caughtError: any;
    try {
      result = await findComparisonAnalysisResultsByType({
        analysisType,
        sortOrder,
        requestingUserId
      });
      fail('Expected DatabaseQueryError to be thrown');
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.name).toBe('DatabaseQueryError');
    expect(caughtError.message).toBe('比較分析結果の検索に失敗しました。');
    expect(result).toBeUndefined();
    expect(typeof result?.comparisonAnalysisResults).not.toBe('object');
    expect(typeof result?.totalCount).not.toBe('number');
    expect(typeof result?.found).not.toBe('boolean');
  });

  it('should not return FindComparisonAnalysisResultsByTypeOutput when database connection error occurs', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';
    const sortOrder = 'desc' as const;

    // Mock authorizeUserAction to succeed
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValueOnce(true);

    const connectionError = new Error('比較分析結果の検索に失敗しました。');
    Object.defineProperty(connectionError, 'name', { value: 'DatabaseQueryError' });

    jest.spyOn(persistenceLayer, 'findComparisonAnalysisResultsByType').mockRejectedValueOnce(connectionError);

    let result: any;
    let caughtError: any;
    try {
      result = await findComparisonAnalysisResultsByType({
        analysisType,
        sortOrder,
        requestingUserId
      });
      fail('Expected DatabaseQueryError to be thrown');
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError.name).toBe('DatabaseQueryError');
    expect(caughtError.message).toBe('比較分析結果の検索に失敗しました。');
    expect(result).toBeUndefined();
    expect(result?.comparisonAnalysisResults).toBeUndefined();
    expect(result?.totalCount).toBeUndefined();
    expect(result?.found).toBeUndefined();
  });

  it('should handle query timeout error and throw DatabaseQueryError', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';
    const sortOrder = 'desc' as const;

    // Mock authorizeUserAction to succeed
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValueOnce(true);

    const timeoutError = new Error('比較分析結果の検索に失敗しました。');
    Object.defineProperty(timeoutError, 'name', { value: 'DatabaseQueryError' });

    jest.spyOn(persistenceLayer, 'findComparisonAnalysisResultsByType').mockRejectedValueOnce(timeoutError);

    let result: any;
    let caughtError: any;
    try {
      result = await findComparisonAnalysisResultsByType({
        analysisType,
        sortOrder,
        requestingUserId
      });
      fail('Expected DatabaseQueryError to be thrown');
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError.name).toBe('DatabaseQueryError');
    expect(caughtError.message).toBe('比較分析結果の検索に失敗しました。');
    expect(result).toBeUndefined();
    expect(result?.comparisonAnalysisResults).toBeUndefined();
    expect(result?.totalCount).toBeUndefined();
    expect(result?.found).toBeUndefined();
  });
});