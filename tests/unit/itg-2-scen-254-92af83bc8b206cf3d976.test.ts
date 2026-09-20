import {
  handleDataRetrievalFailureAndGeneratePlacement,
  HandleDataRetrievalFailureAndGeneratePlacementInput,
  HandleDataRetrievalFailureAndGeneratePlacementOutput,
  PlacementProposal,
  CacheUsageInfo,
  NotificationTarget,
  ManualInputModeSwitchTarget,
  CachedDataSet,
  ProgressDataRecord,
  PerformanceDataRecord,
  WorkerStatusRecord,
  retrieveLatestValidCacheForPlacementGeneration,
  generatePlacementProposalFromCachedData,
  determineDataRetrievalDelayNotificationTargets,
  switchToManualInputModeIfDelayExceedsThreshold,
} from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => ({
  ...jest.requireActual('../../src/logic/data-retrieval-fallback'),
  retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
  generatePlacementProposalFromCachedData: jest.fn(),
  determineDataRetrievalDelayNotificationTargets: jest.fn(),
  switchToManualInputModeIfDelayExceedsThreshold: jest.fn(),
}));

describe('SCEN-254: データ取得失敗時に有効キャッシュから配置案を生成し遅延警告を送信', () => {
  let mockRetrieveLatestValidCache: jest.Mock;
  let mockGeneratePlacementProposal: jest.Mock;
  let mockDetermineNotificationTargets: jest.Mock;
  let mockSwitchToManualInputMode: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // キャッシュデータの構築
    const cachedData: CachedDataSet = {
      progressData: [
        {
          siteId: 'site-A',
          teamId: 'team-1',
          progressRate: 75,
          recordedTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          siteId: 'site-B',
          teamId: 'team-2',
          progressRate: 65,
          recordedTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ] as ProgressDataRecord[],
      performanceData: [
        {
          workerId: 'worker-1',
          productivityRate: 0.85,
          qualityScore: 92,
          recordedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          workerId: 'worker-2',
          productivityRate: 0.78,
          qualityScore: 88,
          recordedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ] as PerformanceDataRecord[],
      workerStatusData: [
        {
          workerId: 'worker-1',
          status: 'available',
          recordedTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          workerId: 'worker-2',
          status: 'busy',
          recordedTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ] as WorkerStatusRecord[],
    };

    const cacheTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const cacheAgeMinutes = 120;

    mockRetrieveLatestValidCache = retrieveLatestValidCacheForPlacementGeneration as jest.Mock;
    mockRetrieveLatestValidCache.mockResolvedValue({
      cacheFound: true,
      cachedData,
      cacheTimestamp,
      cacheAgeMinutes,
      validityStatus: 'valid',
    });

    // 配置案の構築
    const placementProposal: PlacementProposal = {
      proposalId: 'proposal-001',
      proposalType: 'emergency_cache_based',
      assignments: [
        {
          workerId: 'worker-1',
          currentDepartment: 'dept-A',
          proposedDepartment: 'dept-B',
          proposedWorkType: 'assembly',
          skillMatchScore: 85,
        },
        {
          workerId: 'worker-2',
          currentDepartment: 'dept-B',
          proposedDepartment: 'dept-A',
          proposedWorkType: 'inspection',
          skillMatchScore: 78,
        },
      ],
      expectedProductivityImprovement: 12,
      generatedTimestamp: new Date(),
    };

    mockGeneratePlacementProposal = generatePlacementProposalFromCachedData as jest.Mock;
    mockGeneratePlacementProposal.mockResolvedValue({
      placementProposal,
      generationMethod: 'cached_data_only',
      confidenceScore: 82,
    });

    // 通知対象者の構築
    const notificationTargets: NotificationTarget[] = [
      {
        userId: 'user-leader-1',
        role: 'team_leader',
        siteId: 'site-A',
        teamId: 'team-1',
      },
      {
        userId: 'user-leader-2',
        role: 'team_leader',
        siteId: 'site-B',
        teamId: 'team-2',
      },
    ];

    mockDetermineNotificationTargets = determineDataRetrievalDelayNotificationTargets as jest.Mock;
    mockDetermineNotificationTargets.mockResolvedValue({
      notificationTargets,
      targetCount: 2,
    });

    // 手動入力モード切り替え対象の構築
    const switchTargets: ManualInputModeSwitchTarget[] = [
      {
        screenId: 'screen-progress-001',
        screenName: '進捗管理画面',
        targetUserIds: ['user-leader-1'],
      },
      {
        screenId: 'screen-progress-002',
        screenName: '進捗管理画面（サイトB）',
        targetUserIds: ['user-leader-2'],
      },
    ];

    mockSwitchToManualInputMode = switchToManualInputModeIfDelayExceedsThreshold as jest.Mock;
    mockSwitchToManualInputMode.mockResolvedValue({
      switchRequired: true,
      delayMinutes: 45,
      switchTargets,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('WMS・ハンディターミナル連携エラーでデータ取得失敗時に有効キャッシュから配置案を生成し遅延警告を送信して成功する', async () => {
    const now = new Date();
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'wms-001',
      affectedSiteIds: ['site-A', 'site-B'],
      affectedTeamIds: ['team-1', 'team-2'],
      detectionTimestamp: now,
      requestedDataTypes: ['progress_data', 'performance_data', 'worker_status'],
      executingUserId: 'user-admin-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    // retrieveLatestValidCacheForPlacementGenerationが呼び出されたことを検証
    expect(mockRetrieveLatestValidCache).toHaveBeenCalled();

    // generatePlacementProposalFromCachedDataが呼び出されたことを検証
    expect(mockGeneratePlacementProposal).toHaveBeenCalled();

    // determineDataRetrievalDelayNotificationTargetsが呼び出されたことを検証
    expect(mockDetermineNotificationTargets).toHaveBeenCalled();

    // switchToManualInputModeIfDelayExceedsThresholdが呼び出されたことを検証
    expect(mockSwitchToManualInputMode).toHaveBeenCalled();

    // (1) status が 'success' であることを検証
    expect(result.status).toBe('success');

    // (2) placementProposal が null ではなく PlacementProposal 型であることを検証
    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal).toBeDefined();
    if (result.placementProposal) {
      expect(result.placementProposal.proposalId).toBeDefined();
      expect(result.placementProposal.proposalType).toBe('emergency_cache_based');
      expect(result.placementProposal.assignments).toBeDefined();
      expect(Array.isArray(result.placementProposal.assignments)).toBe(true);
      expect(result.placementProposal.generatedTimestamp).toBeInstanceOf(Date);
    }

    // (3) cacheUsageInfo が CacheUsageInfo 型であり、キャッシュが有効であることを検証
    expect(result.cacheUsageInfo).toBeDefined();
    expect(result.cacheUsageInfo.cacheTimestamp).toBeInstanceOf(Date);
    expect(typeof result.cacheUsageInfo.cacheAgeMinutes).toBe('number');
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.dataCompleteness).toBeLessThanOrEqual(100);

    // (4) notificationTargets が NotificationTarget 型の配列で、長さが2であることを検証
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBe(2);
    result.notificationTargets.forEach((target: NotificationTarget) => {
      expect(target.userId).toBeDefined();
      expect(target.role).toBeDefined();
      expect(target.siteId).toBeDefined();
    });

    // (5) manualInputModeSwitched が true であることを検証
    expect(result.manualInputModeSwitched).toBe(true);

    // (6) manualInputModeSwitchTargets が ManualInputModeSwitchTarget 型の配列で、長さが2であることを検証
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(Array.isArray(result.manualInputModeSwitchTargets)).toBe(true);
    expect(result.manualInputModeSwitchTargets!.length).toBe(2);
    result.manualInputModeSwitchTargets!.forEach((target: ManualInputModeSwitchTarget) => {
      expect(target.screenId).toBeDefined();
      expect(target.screenName).toBeDefined();
      expect(Array.isArray(target.targetUserIds)).toBe(true);
    });

    // (7) errorDetails が未定義または空配列であることを検証
    expect(
      result.errorDetails === undefined || (Array.isArray(result.errorDetails) && result.errorDetails.length === 0)
    ).toBe(true);

    // (8) executionTimestamp が現在日時付近であることを検証
    expect(result.executionTimestamp).toBeInstanceOf(Date);
    const timeDiff = Math.abs(result.executionTimestamp.getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(5000); // 5秒以内
  });
});