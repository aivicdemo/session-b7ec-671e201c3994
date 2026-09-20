import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';
import { UnauthorizedAccessError } from '../../src/errors/UnauthorizedAccessError';

jest.mock('../../src/logic/authorization', () => ({
  authorizeUserAction: jest.fn(),
}));

import { authorizeUserAction } from '../../src/logic/authorization';

describe('SCEN-698: ユーザーが比較分析結果へのアクセス権限を持たないとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UnauthorizedAccessError が発生し、エラー文言が「比較分析結果へのアクセス権限がありません。」である', async () => {
    const analysisType = '初期割当実績比較';
    const sortOrder: 'asc' | 'desc' = 'desc';
    const requestingUserId = '権限なしユーザーID';

    (authorizeUserAction as jest.Mock).mockResolvedValue(false);

    let thrownError: Error | null = null;
    try {
      await findComparisonAnalysisResultsByType({
        analysisType,
        sortOrder,
        requestingUserId,
      });
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError).toBeInstanceOf(UnauthorizedAccessError);
    expect(thrownError?.message).toBe('比較分析結果へのアクセス権限がありません。');
    expect(authorizeUserAction).toHaveBeenCalledWith(
      requestingUserId,
      expect.any(String)
    );
  });
});