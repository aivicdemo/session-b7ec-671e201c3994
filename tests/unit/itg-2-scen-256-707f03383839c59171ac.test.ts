import { handleDataRetrievalFailureAndGeneratePlacement } from '../../src/logic/data-retrieval-fallback';

describe('SCEN-256: その他エラーでデータ取得失敗時に有効キャッシュから配置案を生成し遅延警告を送信して成功する', () => {
  let mockRetrieveLatestValidCache: jest.Mock;
  let mockGeneratePlacementProposal: jest.Mock;
  let mockDetermineNotificationTargets: jest.Mock;
  let mockSwitchToManualInputMode: jest.Mock;
  let mockSendDelayWarning: jest.Mock;
  let mockSendManualInputNotification: jest.Mock;
  let mockSavePlacementPlan: jest.Mock;

  beforeEach(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // キャッシュデータの設定
    const cachedDataSet = {
      workerStatusData: [
        {
          workerId: 'WORKER_001',
          status: 'available' as const,
          recordedTimestamp: fiveMinutesAgo,
        },
      ],
      progressData: [
        {
          siteId: 'SITE_A',
          teamId: 'TEAM_001',
          progressRate: 75,
          recordedTimestamp: fiveMinutesAgo,
        },
        {
          siteId: 'SITE_B',
          teamId: 'TEAM_002',
          progressRate: 65,
          recordedTimestamp: fiveMinutesAgo,
        },
      ],
    };

    mockRetrieveLatestValidCache = jest.fn().mockResolvedValue({
      cacheFound: true,
      cachedData: cachedDataSet,
      cacheTimestamp: fiveMinutesAgo,
      cacheAgeMinutes: 5,
      validityStatus: 'valid' as const,
    });

    // PlacementProposal の設定
    const placementProposal = {
      proposalId: 'PROP_001',
      proposalType: 'emergency_cache_based' as const,
      assignments: [
        {
          workerId: 'WORKER_001',
          currentDepartment: 'DEPT_A',
          proposedDepartment: 'DEPT_B',
          proposedWorkType: 'ASSEMBLY',
          skillMatchScore: 85,
        },
      ],
      expectedProductivityImprovement: 12,
      generatedTimestamp: now,
    };

    mockGeneratePlacementProposal = jest.fn().mockResolvedValue({
      placementProposal,
      generationMethod: 'cached_data_only' as const,
      confidenceScore: 78,
    });

    // 通知対象者の設定
    const notificationTargets = [
      {
        userId: 'TEAM_LEADER_001',
        role: 'team_leader',
        siteId: 'SITE_A',
        teamId: 'TEAM_001',
      },
      {
        userId: 'TEAM_LEADER_002',
        role: 'team_leader',
        siteId: 'SITE_B',
        teamId: 'TEAM_002',
      },
      {
        userId: 'USER_ADMIN_001',
        role: 'admin',
        siteId: 'SITE_A',
      },
    ];

    mockDetermineNotificationTargets = jest.fn().mockResolvedValue({
      notificationTargets,
      targetCount: notificationTargets.length,
    });

    // 手動入力モード切り替えの設定
    mockSwitchToManualInputMode = jest.fn().mockResolvedValue({
      switchRequired: true,
      delayMinutes: 35,
      switchTargets: [
        {
          screenId: 'SCREEN_PROGRESS_001',
          screenName: 'Progress Monitoring Dashboard',
          targetUserIds: ['USER_ADMIN_001', 'TEAM_LEADER_001'],
        },
      ],
    });

    mockSendDelayWarning = jest.fn().mockResolvedValue({
      success: true,
      notificationsSent: 3,
    });

    mockSendManualInputNotification = jest.fn().mockResolvedValue({
      success: true,
      notificationsSent: 2,
    });

    mockSavePlacementPlan = jest.fn().mockResolvedValue({
      saved: true,
      placementPlanId: 'PLAN_001',
    });

    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'retrieveLatestValidCacheForPlacementGeneration').mockImplementation(mockRetrieveLatestValidCache);
    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'generatePlacementProposalFromCachedData').mockImplementation(mockGeneratePlacementProposal);
    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'determineDataRetrievalDelayNotificationTargets').mockImplementation(mockDetermineNotificationTargets);
    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'switchToManualInputModeIfDelayExceedsThreshold').mockImplementation(mockSwitchToManualInputMode);
    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'sendDataTransmissionDelayWarning').mockImplementation(mockSendDelayWarning);
    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'sendManualInputModeSwitchNotification').mockImplementation(mockSendManualInputNotification);
    jest.spyOn(require('../../src/logic/data-retrieval-fallback'), 'savePlacementPlan').mockImplementation(mockSavePlacementPlan);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should successfully generate placement proposal from cache and send notifications on unknown error', async () => {
    const input = {
      failureType: 'unknown_error' as const,
      failedDataSourceId: 'HANDY_TERMINAL_001',
      affectedSiteIds: ['SITE_A', 'SITE_B'],
      affectedTeamIds: ['TEAM_001', 'TEAM_002'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'] as const[],
      executingUserId: 'USER_ADMIN_001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.status).toBe('success');
    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal?.proposalId).toBe('PROP_001');
    expect(result.placementProposal?.proposalType).toBe('emergency_cache_based');
    expect(result.placementProposal?.assignments).toHaveLength(1);
    expect(result.placementProposal?.assignments[0].skillMatchScore).toBe(85);

    expect(result.cacheUsageInfo).not.toBeNull();
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBe(5);
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThan(0);

    expect(result.notificationTargets).toHaveLength(3);
    expect(result.notificationTargets).toContainEqual(
      expect.objectContaining({
        userId: 'TEAM_LEADER_001',
        role: 'team_leader',
        siteId: 'SITE_A',
        teamId: 'TEAM_001',
      })
    );
    expect(result.notificationTargets).toContainEqual(
      expect.objectContaining({
        userId: 'TEAM_LEADER_002',
        role: 'team_leader',
        siteId: 'SITE_B',
        teamId: 'TEAM_002',
      })
    );
    expect(result.notificationTargets).toContainEqual(
      expect.objectContaining({
        userId: 'USER_ADMIN_001',
        role: 'admin',
        siteId: 'SITE_A',
      })
    );

    expect(result.manualInputModeSwitched).toBe(true);
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(result.manualInputModeSwitchTargets).toHaveLength(1);
    expect(result.manualInputModeSwitchTargets?.[0].screenId).toBe('SCREEN_PROGRESS_001');
    expect(result.manualInputModeSwitchTargets?.[0].targetUserIds).toContain('USER_ADMIN_001');

    expect(result.errorDetails).toEqual([]);
    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(input.detectionTimestamp.getTime());

    expect(mockRetrieveLatestValidCache).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedSiteIds: ['SITE_A', 'SITE_B'],
        affectedTeamIds: ['TEAM_001', 'TEAM_002'],
        requestedDataTypes: ['progress_data', 'performance_data'],
      })
    );

    expect(mockGeneratePlacementProposal).toHaveBeenCalledWith(
      expect.objectContaining({
        cachedData: expect.any(Object),
        affectedSiteIds: ['SITE_A', 'SITE_B'],
        affectedTeamIds: ['TEAM_001', 'TEAM_002'],
      })
    );

    expect(mockDetermineNotificationTargets).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedSiteIds: ['SITE_A', 'SITE_B'],
        affectedTeamIds: ['TEAM_001', 'TEAM_002'],
        failureType: 'unknown_error',
      })
    );

    expect(mockSwitchToManualInputMode).toHaveBeenCalledWith(
      expect.objectContaining({
        detectionTimestamp: input.detectionTimestamp,
        affectedSiteIds: ['SITE_A', 'SITE_B'],
        affectedTeamIds: ['TEAM_001', 'TEAM_002'],
      })
    );

    expect(mockSendDelayWarning).toHaveBeenCalled();
    expect(mockSendManualInputNotification).toHaveBeenCalled();
    expect(mockSavePlacementPlan).toHaveBeenCalled();
  });
});