import { jest } from '@jest/globals';
import {
  handleDataRetrievalFailureAndGeneratePlacement,
  retrieveLatestValidCacheForPlacementGeneration,
  generatePlacementProposalFromCachedData,
} from '../../src/logic/data-retrieval-fallback';

// Only mock the dependencies, not the function under test
jest.mock('../../src/logic/data-retrieval-fallback', () => {
  const actual = jest.requireActual('../../src/logic/data-retrieval-fallback');
  return {
    ...actual,
    retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
    generatePlacementProposalFromCachedData: jest.fn(),
  };
});

const mockRetrieveLatestValidCache = retrieveLatestValidCacheForPlacementGeneration as jest.MockedFunction<typeof retrieveLatestValidCacheForPlacementGeneration>;
const mockGeneratePlacementProposal = generatePlacementProposalFromCachedData as jest.MockedFunction<typeof generatePlacementProposalFromCachedData>;

describe('SCEN-260: キャッシュデータから配置案生成に失敗した場合にPlacementGenerationFailureErrorを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure status with PlacementGenerationFailureError when placement generation from cache fails', async () => {
    const now = new Date();
    const affectedSiteIds = ['site-A', 'site-B'];
    const affectedTeamIds = ['team-1', 'team-2'];
    const cacheTimestamp = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes before now

    const input = {
      failureType: 'timeout' as const,
      failedDataSourceId: 'WMS-001',
      affectedSiteIds,
      affectedTeamIds,
      detectionTimestamp: now,
      requestedDataTypes: ['progress_data', 'performance_data'] as const,
      executingUserId: 'user-admin-001',
    };

    // Mock retrieveLatestValidCacheForPlacementGeneration to return valid cache
    // (within 30 minutes of current time)
    const mockValidCache = {
      cacheFound: true,
      cachedData: {
        progressData: [
          {
            siteId: 'site-A',
            teamId: 'team-1',
            progressRate: 75,
            recordedTimestamp: cacheTimestamp,
          },
        ],
        performanceData: [
          {
            workerId: 'worker-1',
            productivityRate: 85,
            qualityScore: 90,
            recordedDate: cacheTimestamp,
          },
        ],
      },
      cacheTimestamp,
      cacheAgeMinutes: 15,
      validityStatus: 'valid' as const,
    };

    mockRetrieveLatestValidCache.mockResolvedValueOnce(mockValidCache);

    // Mock generatePlacementProposalFromCachedData to throw PlacementGenerationFailureError
    const placementGenerationError = new Error('キャッシュデータからの配置案生成に失敗しました。管理者に報告してください。');
    (placementGenerationError as any).name = 'PlacementGenerationFailureError';
    mockGeneratePlacementProposal.mockRejectedValueOnce(placementGenerationError);

    // Call the function
    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    // Verify status is 'failure'
    expect(result.status).toBe('failure');

    // Verify placementProposal is null
    expect(result.placementProposal).toBeNull();

    // Verify errorDetails contains PlacementGenerationFailureError with exact message
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toHaveLength(expect.any(Number));
    const placementErrorDetail = result.errorDetails?.find(
      (error) => error.errorName === 'PlacementGenerationFailureError'
    );
    expect(placementErrorDetail).toBeDefined();
    expect(placementErrorDetail?.message).toBe(
      'キャッシュデータからの配置案生成に失敗しました。管理者に報告してください。'
    );

    // Verify cacheUsageInfo is populated with valid cache information
    expect(result.cacheUsageInfo).toBeDefined();
    expect(result.cacheUsageInfo.cacheTimestamp).toBeInstanceOf(Date);
    expect(result.cacheUsageInfo.cacheTimestamp).toEqual(cacheTimestamp);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBe(15);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeLessThanOrEqual(30);
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.dataCompleteness).toBeLessThanOrEqual(100);

    // Verify executionTimestamp is recorded
    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(
      now.getTime()
    );

    // Verify the mocked dependencies were called
    expect(mockRetrieveLatestValidCache).toHaveBeenCalledWith({
      affectedSiteIds,
      affectedTeamIds,
      requestedDataTypes: ['progress_data', 'performance_data'],
      maxCacheAgeMinutes: expect.any(Number),
    });

    expect(mockGeneratePlacementProposal).toHaveBeenCalled();
  });
});