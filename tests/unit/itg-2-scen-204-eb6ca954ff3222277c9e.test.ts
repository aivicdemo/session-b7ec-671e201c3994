import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as persistenceModule from '../../src/logic/persistence-layer';

describe('SCEN-204: エラーハンドリング - データベースエラー時のSystemProcessingError', () => {
  const fieldLeaderUserId = 'user-field-leader-001';
  const userAuthToken = 'valid-auth-token-12345';
  const teamId = 'team-001';
  const aggregationPeriodStartDate = '2024-01-01T00:00:00Z';
  const aggregationPeriodEndDate = '2024-01-31T23:59:59Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findProductivityDataByTeamAndPeriod がデータベースエラーを返した場合、SystemProcessingError が発生する', async () => {
    // 前提条件：認証ユーザーの設定
    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: fieldLeaderUserId,
      isValid: true,
    });

    // 前提条件：現場リーダー権限の確認
    jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      role: 'fieldLeader',
    });

    // 前提条件：データベースエラーのシミュレーション
    const dbError = new Error('Database connection timeout');
    jest.spyOn(persistenceModule, 'findProductivityDataByTeamAndPeriod').mockRejectedValue(dbError);

    // 実行
    const input = {
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      teamId,
      siteId: undefined,
      fieldLeaderUserId,
      userAuthToken,
    };

    // 検証：SystemProcessingError がスロー（throw）されることを確認
    await expect(validateAggregatedPerformanceData(input)).rejects.toThrow();

    // スロー例外の詳細確認
    try {
      await validateAggregatedPerformanceData(input);
      fail('Expected SystemProcessingError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('SystemProcessingError');
      expect(error.message).toContain('検証処理中にシステムエラーが発生しました');
      expect(error.message).toContain('管理者に報告してください');
    }
  });
});