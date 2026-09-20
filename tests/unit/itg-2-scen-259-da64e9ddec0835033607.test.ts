import {
  handleDataRetrievalFailureAndGeneratePlacement,
  HandleDataRetrievalFailureAndGeneratePlacementInput,
  RetrieveLatestValidCacheForPlacementGenerationOutput,
  retrieveLatestValidCacheForPlacementGeneration,
} from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => {
  const actual = jest.requireActual('../../src/logic/data-retrieval-fallback');
  return {
    ...actual,
    retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
  };
});

describe('SCEN-259: 有効キャッシュが有効期限を超過している場合に手動入力モードに切り替える', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure status with manual input mode switched when cache has expired', async () => {
    const now = new Date();
    const expiredCacheTimestamp = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const cacheAgeMinutes = 25 * 60;

    const expiredCacheOutput: RetrieveLatestValidCacheForPlacementGenerationOutput = {
      cacheFound: true,
      cachedData: {
        progressData: [
          {
            siteId: 'SITE-A',
            teamId: 'TEAM-001',
            progressRate: 50,
            recordedTimestamp: expiredCacheTimestamp,
          },
        ],
      },
      cacheTimestamp: expiredCacheTimestamp,
      cacheAgeMinutes: cacheAgeMinutes,
      validityStatus: 'expired',
    };

    (retrieveLatestValidCacheForPlacementGeneration as jest.Mock).mockResolvedValue(
      expiredCacheOutput,
    );

    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A'],
      affectedTeamIds: ['TEAM-001'],
      detectionTimestamp: now,
      requestedDataTypes: ['progress_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.status).toBe('failure');

    expect(result.placementProposal).toBeNull();

    expect(result.cacheUsageInfo).toBeDefined();
    expect(result.cacheUsageInfo.cacheTimestamp).toEqual(expiredCacheTimestamp);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBe(cacheAgeMinutes);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeGreaterThan(1440);

    expect(result.manualInputModeSwitched).toBe(true);
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(result.manualInputModeSwitchTargets!.length).toBeGreaterThan(0);

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails!.length).toBeGreaterThan(0);

    const errorDetail = result.errorDetails![0];
    expect(errorDetail.errorName).toBe('ValidCacheNotAvailableError');
    expect(errorDetail.errorMessage).toBe(
      '有効なキャッシュデータが利用できません。手動入力モードに切り替えてください。',
    );

    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toBeInstanceOf(Date);

    expect(retrieveLatestValidCacheForPlacementGeneration).toHaveBeenCalled();
  });
});