import {
  handleDataRetrievalFailureAndGeneratePlacement,
  HandleDataRetrievalFailureAndGeneratePlacementInput,
  HandleDataRetrievalFailureAndGeneratePlacementOutput,
  retrieveLatestValidCacheForPlacementGeneration,
} from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => {
  const actual = jest.requireActual('../../src/logic/data-retrieval-fallback');
  return {
    ...actual,
    retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
  };
});

describe('SCEN-258: Data Retrieval Failure with Cache Fallback and Manual Mode Switch', () => {
  describe('有効キャッシュが存在しない場合に手動入力モードに切り替えてValidCacheNotAvailableErrorを返す', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return failure status with appropriate errors when valid cache is not available', async () => {
      // Arrange
      const currentTime = new Date();
      const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
        failureType: 'timeout',
        failedDataSourceId: 'WMS-001',
        affectedSiteIds: ['SITE-A', 'SITE-B'],
        affectedTeamIds: ['TEAM-01', 'TEAM-02'],
        detectionTimestamp: currentTime,
        requestedDataTypes: ['progress_data', 'performance_data'],
        executingUserId: 'USER-123',
      };

      // Setup stub for retrieveLatestValidCacheForPlacementGeneration to return null
      (retrieveLatestValidCacheForPlacementGeneration as jest.Mock).mockResolvedValue({
        cacheFound: false,
        cachedData: null,
        cacheTimestamp: null,
        cacheAgeMinutes: null,
        validityStatus: 'not_found',
      });

      // Act
      const output = await handleDataRetrievalFailureAndGeneratePlacement(input);

      // Assert
      expect(output.status).toBe('failure');
      expect(output.placementProposal).toBeNull();
      expect(output.manualInputModeSwitched).toBe(true);

      // Verify DataRetrievalTimeoutError is in errorDetails
      const timeoutError = output.errorDetails?.find(
        (e) => e.name === 'DataRetrievalTimeoutError'
      );
      expect(timeoutError).toBeDefined();
      expect(timeoutError?.message).toBe(
        'データ取得がタイムアウトしました。キャッシュデータを使用して配置案を生成します。'
      );

      // Verify ValidCacheNotAvailableError is in errorDetails
      const cacheError = output.errorDetails?.find(
        (e) => e.name === 'ValidCacheNotAvailableError'
      );
      expect(cacheError).toBeDefined();
      expect(cacheError?.message).toBe(
        '有効なキャッシュデータが利用できません。手動入力モードに切り替えてください。'
      );

      // Verify manual input mode switch targets
      expect(output.manualInputModeSwitchTargets).toBeDefined();
      expect(output.manualInputModeSwitchTargets?.length).toBeGreaterThan(0);
      if (output.manualInputModeSwitchTargets) {
        output.manualInputModeSwitchTargets.forEach((target) => {
          expect(target.screenId).toBeDefined();
          expect(target.screenName).toBeDefined();
          expect(target.targetUserIds.length).toBeGreaterThan(0);
        });
      }

      // Verify cache usage info
      expect(output.cacheUsageInfo).toBeDefined();
      expect(output.cacheUsageInfo.dataCompleteness).toBeDefined();

      // Verify execution timestamp is after call time
      expect(output.executionTimestamp.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
    });

    it('should include affected site and team IDs in manual input mode switch targets', async () => {
      // Arrange
      const currentTime = new Date();
      const affectedSites = ['SITE-A', 'SITE-B'];
      const affectedTeams = ['TEAM-01', 'TEAM-02'];
      const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
        failureType: 'timeout',
        failedDataSourceId: 'WMS-001',
        affectedSiteIds: affectedSites,
        affectedTeamIds: affectedTeams,
        detectionTimestamp: currentTime,
        requestedDataTypes: ['progress_data', 'performance_data'],
        executingUserId: 'USER-123',
      };

      // Setup stub for retrieveLatestValidCacheForPlacementGeneration to return null
      (retrieveLatestValidCacheForPlacementGeneration as jest.Mock).mockResolvedValue({
        cacheFound: false,
        cachedData: null,
        cacheTimestamp: null,
        cacheAgeMinutes: null,
        validityStatus: 'not_found',
      });

      // Act
      const output = await handleDataRetrievalFailureAndGeneratePlacement(input);

      // Assert
      expect(output.manualInputModeSwitchTargets).toBeDefined();
      if (output.manualInputModeSwitchTargets) {
        const switchTargets = output.manualInputModeSwitchTargets;
        expect(switchTargets.length).toBeGreaterThan(0);
        switchTargets.forEach((target) => {
          expect(target.screenId).toBeDefined();
          expect(target.screenName).toBeDefined();
          expect(target.targetUserIds).toBeDefined();
          expect(Array.isArray(target.targetUserIds)).toBe(true);
          expect(target.targetUserIds.length).toBeGreaterThan(0);
        });
      }
    });

    it('should have null placement proposal when cache is unavailable', async () => {
      // Arrange
      const currentTime = new Date();
      const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
        failureType: 'connection_error',
        failedDataSourceId: 'HANDY-TERMINAL-001',
        affectedSiteIds: ['SITE-C'],
        affectedTeamIds: ['TEAM-03'],
        detectionTimestamp: currentTime,
        requestedDataTypes: ['worker_status'],
        executingUserId: 'USER-456',
      };

      // Setup stub for retrieveLatestValidCacheForPlacementGeneration to return null
      (retrieveLatestValidCacheForPlacementGeneration as jest.Mock).mockResolvedValue({
        cacheFound: false,
        cachedData: null,
        cacheTimestamp: null,
        cacheAgeMinutes: null,
        validityStatus: 'not_found',
      });

      // Act
      const output = await handleDataRetrievalFailureAndGeneratePlacement(input);

      // Assert
      expect(output.placementProposal).toBeNull();
      expect(output.status).toBe('failure');
    });

    it('should include notification targets in output', async () => {
      // Arrange
      const currentTime = new Date();
      const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
        failureType: 'unknown_error',
        failedDataSourceId: 'DATA-SOURCE-001',
        affectedSiteIds: ['SITE-D', 'SITE-E'],
        affectedTeamIds: ['TEAM-04', 'TEAM-05'],
        detectionTimestamp: currentTime,
        requestedDataTypes: ['progress_data', 'performance_data', 'worker_status'],
        executingUserId: 'USER-789',
      };

      // Setup stub for retrieveLatestValidCacheForPlacementGeneration to return null
      (retrieveLatestValidCacheForPlacementGeneration as jest.Mock).mockResolvedValue({
        cacheFound: false,
        cachedData: null,
        cacheTimestamp: null,
        cacheAgeMinutes: null,
        validityStatus: 'not_found',
      });

      // Act
      const output = await handleDataRetrievalFailureAndGeneratePlacement(input);

      // Assert
      expect(output.notificationTargets).toBeDefined();
      expect(Array.isArray(output.notificationTargets)).toBe(true);
      expect(output.notificationTargets.length).toBeGreaterThan(0);
      output.notificationTargets.forEach((target) => {
        expect(target.userId).toBeDefined();
        expect(target.role).toBeDefined();
        expect(target.siteId).toBeDefined();
      });
    });
  });
});