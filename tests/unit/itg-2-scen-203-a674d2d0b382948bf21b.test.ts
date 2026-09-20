import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

describe('SCEN-203: データ品質検証 - 権限エラー', () => {
  let authorizeUserActionSpy: jest.SpyInstance;

  beforeEach(() => {
    // authorizeUserAction をモック化して、UnauthorizedAccessError をスロー
    authorizeUserActionSpy = jest.spyOn(dataQualityValidation, 'authorizeUserAction' as any)
      .mockImplementation(() => {
        const error = new Error('この操作を実行する権限がありません。');
        error.name = 'UnauthorizedAccessError';
        throw error;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('authorizeUserAction が権限なしを返した場合、UnauthorizedAccessError が発生する', () => {
    // Arrange
    const userAuthToken = 'valid_token_12345';
    const aggregationPeriodStartDate = '2024-01-01';
    const aggregationPeriodEndDate = '2024-01-31';
    const teamId = 'team_001';
    const siteId = 'site_001';
    const fieldLeaderUserId = 'user_999';

    // Act & Assert
    expect(() => {
      validateAggregatedPerformanceData({
        aggregationPeriodStartDate,
        aggregationPeriodEndDate,
        teamId,
        siteId,
        fieldLeaderUserId,
        userAuthToken,
      });
    }).toThrow(
      expect.objectContaining({
        name: 'UnauthorizedAccessError',
        message: 'この操作を実行する権限がありません。',
      })
    );

    // authorizeUserAction が呼び出されたことを確認
    expect(authorizeUserActionSpy).toHaveBeenCalled();
  });
});