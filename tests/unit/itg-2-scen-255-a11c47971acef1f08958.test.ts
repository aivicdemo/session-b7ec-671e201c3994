import {
  handleDataRetrievalFailureAndGeneratePlacement,
  HandleDataRetrievalFailureAndGeneratePlacementInput,
  RetrieveLatestValidCacheForPlacementGenerationInput,
  RetrieveLatestValidCacheForPlacementGenerationOutput,
  GeneratePlacementProposalFromCachedDataInput,
  GeneratePlacementProposalFromCachedDataOutput,
  DetermineDataRetrievalDelayNotificationTargetsInput,
  DetermineDataRetrievalDelayNotificationTargetsOutput,
  SwitchToManualInputModeIfDelayExceedsThresholdInput,
  SwitchToManualInputModeIfDelayExceedsThresholdOutput,
  PlacementProposal,
  NotificationTarget,
  CachedDataSet,
  ProgressDataRecord,
  PerformanceDataRecord,
  WorkerStatusRecord,
} from '../../src/logic/data-retrieval-fallback';
import * as dataRetrievalFallback from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => ({
  ...jest.requireActual('../../src/logic/data-retrieval-fallback'),
  retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
  generatePlacementProposalFromCachedData: jest.fn(),
  determineDataRetrievalDelayNotificationTargets: jest.fn(),
  switchToManualInputModeIfDelayExceedsThreshold: jest.fn(),
  sendDataTransmissionDelayWarning: jest.fn(),
  savePlacementPlan: jest.fn(),
}));

describe('handleDataRetrievalFailureAndGeneratePlacement - SCEN-255', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('接続エラーでデータ取得失敗時に有効キャッシュから配置案を生成し遅延警告を送信して成功する', async () => {
    // Step 1: テスト用の入力データを準備する
    const detectionTimestamp = new Date();
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'connection_error',
      failedDataSourceId: 'wms-001',
      affectedSiteIds: ['site-001', 'site-002'],
      affectedTeamIds: ['team-A', 'team-B'],
      detectionTimestamp,
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'user-001',
    };

    // Step 2: retrieveLatestValidCacheForPlacementGeneration をスタブ設定
    const cacheTimestamp = new Date(detectionTimestamp.getTime() - 30 * 60000); // 30分前
    const cachedDataSet: CachedDataSet = {
      progressData: [
        {
          siteId: 'site-001',
          teamId: 'team-A',
          progressRate: 75,
          recordedTimestamp: cacheTimestamp,
        } as ProgressDataRecord,
      ],
      performanceData: [
        {
          workerId: 'worker-001',
          productivityRate: 0.85,
          qualityScore: 92,
          recordedDate: cacheTimestamp,
        } as PerformanceDataRecord,
      ],
      workerStatusData: [
        {
          workerId: 'worker-001',
          status: 'available',
          recordedTimestamp: cacheTimestamp,
        } as WorkerStatusRecord,
      ],
    };

    const cacheRetrievalOutput: RetrieveLatestValidCacheForPlacementGenerationOutput = {
      cacheFound: true,
      cachedData: cachedDataSet,
      cacheTimestamp,
      cacheAgeMinutes: 30,
      validityStatus: 'valid',
    };

    (
      dataRetrievalFallback.retrieveLatestValidCacheForPlacementGeneration as jest.Mock
    ).mockResolvedValue(cacheRetrievalOutput);

    // Step 3: generatePlacementProposalFromCachedData をスタブ設定
    const placementProposal: PlacementProposal = {
      proposalId: 'proposal-001',
      proposalType: 'emergency_cache_based',
      assignments: [
        {
          workerId: 'worker-002',
          currentDepartment: 'team-B',
          proposedDepartment: 'team-A',
          proposedWorkType: 'assembly',
          skillMatchScore: 88,
        },
      ],
      expectedProductivityImprovement: 12,
      generatedTimestamp: new Date(),
    };

    const placementGenerationOutput: GeneratePlacementProposalFromCachedDataOutput = {
      placementProposal,
      generationMethod: 'cached_data_only',
      confidenceScore: 82,
    };

    (
      dataRetrievalFallback.generatePlacementProposalFromCachedData as jest.Mock
    ).mockResolvedValue(placementGenerationOutput);

    // Step 4: determineDataRetrievalDelayNotificationTargets をスタブ設定
    const notificationTargets: NotificationTarget[] = [
      {
        userId: 'user-leader-A',
        role: 'team_leader',
        siteId: 'site-001',
        teamId: 'team-A',
      },
      {
        userId: 'user-leader-B',
        role: 'team_leader',
        siteId: 'site-002',
        teamId: 'team-B',
      },
      {
        userId: 'user-manager-001',
        role: 'site_manager',
        siteId: 'site-001',
      },
    ];

    const notificationTargetsOutput: DetermineDataRetrievalDelayNotificationTargetsOutput = {
      notificationTargets,
      targetCount: notificationTargets.length,
    };

    (
      dataRetrievalFallback.determineDataRetrievalDelayNotificationTargets as jest.Mock
    ).mockResolvedValue(notificationTargetsOutput);

    // Step 5: switchToManualInputModeIfDelayExceedsThreshold をスタブ設定
    const manualInputModeOutput: SwitchToManualInputModeIfDelayExceedsThresholdOutput = {
      switchRequired: false,
      delayMinutes: 15,
    };

    (
      dataRetrievalFallback.switchToManualInputModeIfDelayExceedsThreshold as jest.Mock
    ).mockResolvedValue(manualInputModeOutput);

    // Step 6: sendDataTransmissionDelayWarning をスタブ設定
    (dataRetrievalFallback.sendDataTransmissionDelayWarning as jest.Mock).mockResolvedValue({
      sent: true,
      sentCount: notificationTargets.length,
    });

    // Step 7: savePlacementPlan をスタブ設定
    (dataRetrievalFallback.savePlacementPlan as jest.Mock).mockResolvedValue({
      savedId: 'saved-proposal-001',
    });

    // Step 8: 準備した入力データで handleDataRetrievalFailureAndGeneratePlacement を呼び出す
    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    // Expected Result 検証
    // 1. status が 'success' である
    expect(result.status).toBe('success');

    // 2. placementProposal が null ではなく、キャッシュから生成された配置案オブジェクトを含む
    expect(result.placementProposal).not.toBeNull();
    if (result.placementProposal) {
      expect(result.placementProposal.proposalId).toBeDefined();
      expect(result.placementProposal.proposalType).toBe('emergency_cache_based');
      expect(result.placementProposal.assignments).toBeDefined();
      expect(Array.isArray(result.placementProposal.assignments)).toBe(true);
      expect(result.placementProposal.generatedTimestamp).toBeInstanceOf(Date);
    }

    // 3. cacheUsageInfo に、使用したキャッシュのタイムスタンプと有効性が含まれる
    expect(result.cacheUsageInfo).toBeDefined();
    expect(result.cacheUsageInfo.cacheTimestamp).toBeInstanceOf(Date);
    expect(result.cacheUsageInfo.cacheTimestamp.getTime()).toEqual(cacheTimestamp.getTime());
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.dataCompleteness).toBeLessThanOrEqual(100);

    // 4. notificationTargets が空配列ではなく、affectedTeamIds に属する複数の通知対象者情報を含む
    expect(result.notificationTargets.length).toBeGreaterThan(0);
    expect(result.notificationTargets.length).toBe(notificationTargets.length);
    const notificationTeamIds = result.notificationTargets
      .map((target) => target.teamId)
      .filter((teamId) => teamId !== undefined);
    expect(notificationTeamIds.length).toBeGreaterThan(0);
    notificationTeamIds.forEach((teamId) => {
      expect(input.affectedTeamIds).toContain(teamId);
    });
    result.notificationTargets.forEach((target) => {
      expect(target.userId).toBeDefined();
      expect(typeof target.userId).toBe('string');
      expect(target.role).toBeDefined();
      expect(typeof target.role).toBe('string');
      expect(target.siteId).toBeDefined();
      expect(typeof target.siteId).toBe('string');
    });

    // 5. manualInputModeSwitched が false である
    expect(result.manualInputModeSwitched).toBe(false);

    // 6. manualInputModeSwitchTargets が存在しないか空配列である
    expect(
      result.manualInputModeSwitchTargets === undefined ||
        (Array.isArray(result.manualInputModeSwitchTargets) &&
          result.manualInputModeSwitchTargets.length === 0)
    ).toBe(true);

    // 7. errorDetails が存在しないか空配列である
    expect(
      result.errorDetails === undefined ||
        (Array.isArray(result.errorDetails) && result.errorDetails.length === 0)
    ).toBe(true);

    // 8. executionTimestamp が現在時刻付近である
    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(
      detectionTimestamp.getTime()
    );
    expect(result.executionTimestamp.getTime() - detectionTimestamp.getTime()).toBeLessThan(
      10000
    );
  });
});