import { validateAggregatedPerformanceData, AggregatedDataNotFoundError } from '../../src/logic/data-quality-validation';
import * as dataQualityValidation from '../../src/logic/data-quality-validation';

jest.mock('../../src/logic/data-quality-validation', () => {
  const actualModule = jest.requireActual('../../src/logic/data-quality-validation');
  return {
    ...actualModule,
  };
});

describe('SCEN-176: エラー：指定された集約対象期間のデータがシステムに存在しない場合、AggregatedDataNotFoundErrorが発生する', () => {
  let authenticateUserSpy: jest.SpyInstance;
  let authorizeUserActionSpy: jest.SpyInstance;
  let findProductivityDataByTeamAndPeriodSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    authenticateUserSpy = jest.spyOn(dataQualityValidation as any, 'authenticateUser').mockResolvedValue({
      userId: 'field-leader-user-id',
      role: 'field-leader',
    });

    authorizeUserActionSpy = jest.spyOn(dataQualityValidation as any, 'authorizeUserAction').mockResolvedValue(true);

    findProductivityDataByTeamAndPeriodSpy = jest.spyOn(dataQualityValidation as any, 'findProductivityDataByTeamAndPeriod').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw AggregatedDataNotFoundError with correct message when aggregated data does not exist (empty array case)', async () => {
    const userAuthToken = 'valid-auth-token';
    const fieldLeaderUserId = 'field-leader-user-id';
    const teamId = 'team-id';
    const aggregationPeriodStartDate = '2024-01-01T00:00:00Z';
    const aggregationPeriodEndDate = '2024-01-31T23:59:59Z';

    const input = {
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      teamId,
      fieldLeaderUserId,
      userAuthToken,
    };

    try {
      await validateAggregatedPerformanceData(input);
      fail('Expected AggregatedDataNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AggregatedDataNotFoundError);
      expect(error.message).toBe('指定期間の集約データが見つかりません。データ集約処理の完了を確認してください。');
      expect(error.name).toBe('AggregatedDataNotFoundError');
    }

    expect(authenticateUserSpy).toHaveBeenCalledWith(userAuthToken);
    expect(authorizeUserActionSpy).toHaveBeenCalledWith(fieldLeaderUserId, 'validate_performance_data');
    expect(findProductivityDataByTeamAndPeriodSpy).toHaveBeenCalledWith(teamId, aggregationPeriodStartDate, aggregationPeriodEndDate);
  });

  it('should throw AggregatedDataNotFoundError with correct message when aggregated data does not exist (null case)', async () => {
    findProductivityDataByTeamAndPeriodSpy.mockResolvedValueOnce(null);

    const userAuthToken = 'valid-auth-token';
    const fieldLeaderUserId = 'field-leader-user-id';
    const teamId = 'team-id';
    const aggregationPeriodStartDate = '2024-02-01T00:00:00Z';
    const aggregationPeriodEndDate = '2024-02-29T23:59:59Z';

    const input = {
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      teamId,
      fieldLeaderUserId,
      userAuthToken,
    };

    try {
      await validateAggregatedPerformanceData(input);
      fail('Expected AggregatedDataNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AggregatedDataNotFoundError);
      expect(error.message).toBe('指定期間の集約データが見つかりません。データ集約処理の完了を確認してください。');
      expect(error.name).toBe('AggregatedDataNotFoundError');
    }

    expect(authenticateUserSpy).toHaveBeenCalledWith(userAuthToken);
    expect(authorizeUserActionSpy).toHaveBeenCalledWith(fieldLeaderUserId, 'validate_performance_data');
    expect(findProductivityDataByTeamAndPeriodSpy).toHaveBeenCalledWith(teamId, aggregationPeriodStartDate, aggregationPeriodEndDate);
  });
});