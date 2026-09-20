import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as persistenceModule from '../../src/logic/persistence-layer';

describe('SCEN-182: 境界：集約データセットが空の場合、実績データ存在なしの例外が throw される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AggregatedDataNotFoundError when aggregated data is empty', async () => {
    // Step 1: 入力型 ValidateAggregatedPerformanceDataInput オブジェクトを構築
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      siteId: undefined,
      fieldLeaderUserId: 'USER-FL-001',
      userAuthToken: 'valid-token-xyz'
    };

    // Step 2: authenticateUser をスタブ化
    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'USER-FL-001',
      role: 'fieldLeader',
      isAuthenticated: true
    } as any);

    // Step 3: authorizeUserAction をスタブ化
    jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: 'USER-FL-001'
    } as any);

    // Step 4: findProductivityDataByTeamAndPeriod をスタブ化し、空配列を返す
    jest.spyOn(persistenceModule, 'findProductivityDataByTeamAndPeriod').mockResolvedValue([]);

    // Step 5: validateAggregatedPerformanceData を呼び出し
    try {
      await validateAggregatedPerformanceData(input);
      fail('Expected exception to be thrown');
    } catch (error: any) {
      // Step 6: 例外の型が AggregatedDataNotFoundError であることを検証
      expect(error.constructor.name).toBe('AggregatedDataNotFoundError');

      // Step 7: 例外メッセージが設計済みエラー文言と一致することを検証
      expect(error.message).toBe(
        '指定期間の集約データが見つかりません。データ集約処理の完了を確認してください。'
      );
    }
  });
});