import { findComparisonAnalysisResultsByType } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/auth/authorize';

describe('findComparisonAnalysisResultsByType - SCEN-705', () => {
  beforeEach(() => {
    jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      permissions: ['比較分析結果.参照'],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return empty results when no comparison analysis records match the specified analysis type', async () => {
    const requestingUserId = 'user-001';
    const analysisType = '初期割当実績比較';
    const sortOrder = 'desc' as const;

    const result = await findComparisonAnalysisResultsByType({
      analysisType,
      sortOrder,
      requestingUserId,
    });

    expect(result.comparisonAnalysisResults).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.found).toBe(false);
    expect(result.analysisType).toBe('初期割当実績比較');
  });
});