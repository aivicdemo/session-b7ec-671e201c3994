import {
  handleDataRetrievalFailureAndGeneratePlacement,
  HandleDataRetrievalFailureAndGeneratePlacementInput,
  HandleDataRetrievalFailureAndGeneratePlacementOutput,
  RetrieveLatestValidCacheForPlacementGenerationInput,
  RetrieveLatestValidCacheForPlacementGenerationOutput,
  GeneratePlacementProposalFromCachedDataInput,
  GeneratePlacementProposalFromCachedDataOutput,
  DetermineDataRetrievalDelayNotificationTargetsInput,
  DetermineDataRetrievalDelayNotificationTargetsOutput,
  SwitchToManualInputModeIfDelayExceedsThresholdInput,
  SwitchToManualInputModeIfDelayExceedsThresholdOutput,
  CachedDataSet,
  ProgressDataRecord,
  PerformanceDataRecord,
  WorkerStatusRecord,
  PlacementProposal,
  PlacementAssignment,
  NotificationTarget,
  ManualInputModeSwitchTarget,
  CacheUsageInfo,
  ErrorDetail,
} from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => ({
  ...jest.requireActual('../../src/logic/data-retrieval-fallback'),
  retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
  generatePlacementProposalFromCachedData: jest.fn(),
  determineDataRetrievalDelayNotificationTargets: jest.fn(),
  switchToManualInputModeIfDelayExceedsThreshold: jest.fn(),
  sendDataTransmissionDelayWarning: jest.fn(),
  sendManualInputModeSwitchNotification: jest.fn(),
  savePlacementPlan: jest.fn(),
}));

describe('SCEN-264: 配置案生成に部分的に成功した場合にpartial_successステータスを返す', () => {
  let mockRetrieveLatestValidCache: jest.Mock;
  let mockGeneratePlacementProposal: jest.Mock;
  let mockDetermineNotificationTargets: jest.Mock;
  let mockSwitchToManualInputMode: jest.Mock;
  let mockSendDelayWarning: jest.Mock;
  let mockSendManualInputNotification: jest.Mock;
  let mockSavePlacementPlan: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    mockRetrieveLatestValidCache = require('../../src/logic/data-retrieval-fallback')
      .retrieveLatestValidCacheForPlacementGeneration as jest.Mock;
    mockGeneratePlacementProposal = require('../../src/logic/data-retrieval-fallback')
      .generatePlacementProposalFromCachedData as jest.Mock;
    mockDetermineNotificationTargets = require('../../src/logic/data-retrieval-fallback')
      .determineDataRetrievalDelayNotificationTargets as jest.Mock;
    mockSwitchToManualInputMode = require('../../src/logic/data-retrieval-fallback')
      .switchToManualInputModeIfDelayExceedsThreshold as jest.Mock;
    mockSendDelayWarning = require('../../src/logic/data-retrieval-fallback')
      .sendDataTransmissionDelayWarning as jest.Mock;
    mockSendManualInputNotification = require('../../src/logic/data-retrieval-fallback')
      .sendManualInputModeSwitchNotification as jest.Mock;
    mockSavePlacementPlan = require('../../src/logic/data-retrieval-fallback')
      .savePlacementPlan as jest.Mock;

    // キャッシュ取得スタブ：有効なキャッシュを返す
    mockRetrieveLatestValidCache.mockResolvedValue({
      cacheFound: true,
      cachedData: {
        progressData: [
          {
            siteId: 'SITE-A',
            teamId: 'TEAM-1',
            progressRate: 65,
            recordedTimestamp: thirtyMinutesAgo,
          } as ProgressDataRecord,
          {
            siteId: 'SITE-B',
            teamId: 'TEAM-2',
            progressRate: 45,
            recordedTimestamp: thirtyMinutesAgo,
          } as ProgressDataRecord,
        ],
        performanceData: [
          {
            workerId: 'WORKER-1',
            productivityRate: 85,
            qualityScore: 90,
            recordedDate: thirtyMinutesAgo,
          } as PerformanceDataRecord,
        ],
        workerStatusData: [
          {
            workerId: 'WORKER-1',
            status: 'available' as const,
            recordedTimestamp: thirtyMinutesAgo,
          } as WorkerStatusRecord,
        ],
      } as CachedDataSet,
      cacheTimestamp: thirtyMinutesAgo,
      cacheAgeMinutes: 30,
      validityStatus: 'valid' as const,
    } as RetrieveLatestValidCacheForPlacementGenerationOutput);

    // 配置案生成スタブ：部分的に成功した配置案を返す
    mockGeneratePlacementProposal.mockResolvedValue({
      placementProposal: {
        proposalId: 'PROP-001',
        proposalType: 'emergency_cache_based' as const,
        assignments: [
          {
            workerId: 'WORKER-1',
            currentDepartment: 'DEPT-A',
            proposedDepartment: 'DEPT-B',
            proposedWorkType: 'assembly',
            skillMatchScore: 85,
          } as PlacementAssignment,
          {
            workerId: 'WORKER-2',
            currentDepartment: 'DEPT-C',
            proposedDepartment: 'DEPT-A',
            proposedWorkType: 'inspection',
            skillMatchScore: 75,
          } as PlacementAssignment,
        ],
        expectedProductivityImprovement: 12,
        generatedTimestamp: now,
      } as PlacementProposal,
      generationMethod: 'cached_data_only' as const,
      confidenceScore: 78,
    } as GeneratePlacementProposalFromCachedDataOutput);

    // 通知対象者決定スタブ：複数の通知対象を返す
    mockDetermineNotificationTargets.mockResolvedValue({
      notificationTargets: [
        {
          userId: 'USER-101',
          role: 'site_manager',
          siteId: 'SITE-A',
          teamId: 'TEAM-1',
        } as NotificationTarget,
        {
          userId: 'USER-102',
          role: 'site_manager',
          siteId: 'SITE-B',
          teamId: 'TEAM-2',
        } as NotificationTarget,
        {
          userId: 'USER-103',
          role: 'team_leader',
          siteId: 'SITE-A',
          teamId: 'TEAM-1',
        } as NotificationTarget,
        {
          userId: 'USER-104',
          role: 'team_leader',
          siteId: 'SITE-B',
          teamId: 'TEAM-2',
        } as NotificationTarget,
      ],
      targetCount: 4,
    } as DetermineDataRetrievalDelayNotificationTargetsOutput);

    // 手動入力モード切り替えスタブ：切り替え実行を返す
    mockSwitchToManualInputMode.mockResolvedValue({
      switchRequired: true,
      delayMinutes: 35,
      switchTargets: [
        {
          screenId: 'SCREEN-PROGRESS',
          screenName: '進捗入力画面',
          targetUserIds: ['USER-101', 'USER-102'],
        } as ManualInputModeSwitchTarget,
      ],
    } as SwitchToManualInputModeIfDelayExceedsThresholdOutput);

    // 遅延警告送信スタブ
    mockSendDelayWarning.mockResolvedValue({ success: true });

    // 手動入力モード通知送信スタブ
    mockSendManualInputNotification.mockResolvedValue({ success: true });

    // 配置案保存スタブ
    mockSavePlacementPlan.mockResolvedValue({ success: true });
  });

  test('データ取得失敗時にキャッシュを使用して配置案を部分的に生成し、partial_successを返すこと', async () => {
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.status).toBe('partial_success');
    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal!.proposalType).toBe('emergency_cache_based');
    expect(result.placementProposal!.assignments.length).toBeGreaterThanOrEqual(1);

    expect(result.cacheUsageInfo).not.toBeNull();
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeLessThanOrEqual(30);
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThan(0);

    expect(result.notificationTargets.length).toBeGreaterThanOrEqual(3);
    result.notificationTargets.forEach((target) => {
      expect(target.userId).toBeDefined();
      expect(target.role).toBeDefined();
      expect(target.siteId).toBeDefined();
      expect(input.affectedSiteIds.includes(target.siteId)).toBe(true);
    });

    expect(result.manualInputModeSwitched).toBe(true);
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(result.manualInputModeSwitchTargets!.length).toBeGreaterThanOrEqual(1);
    expect(result.manualInputModeSwitchTargets![0].screenId).toBeDefined();
    expect(result.manualInputModeSwitchTargets![0].targetUserIds.length).toBeGreaterThanOrEqual(1);

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails!.length).toBeGreaterThanOrEqual(1);
    expect(
      result.errorDetails!.some((error) =>
        error.message.includes('タイムアウト') ||
        error.message.includes('キャッシュ') ||
        error.message.includes('timeout') ||
        error.message.includes('cache')
      )
    ).toBe(true);

    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.executionTimestamp.getTime()).toBeGreaterThan(
      input.detectionTimestamp.getTime() - 10000
    );

    expect(mockRetrieveLatestValidCache).toHaveBeenCalled();
    expect(mockGeneratePlacementProposal).toHaveBeenCalled();
    expect(mockDetermineNotificationTargets).toHaveBeenCalled();
    expect(mockSwitchToManualInputMode).toHaveBeenCalled();
    expect(mockSendDelayWarning).toHaveBeenCalled();
    expect(mockSendManualInputNotification).toHaveBeenCalled();
    expect(mockSavePlacementPlan).toHaveBeenCalled();
  });

  test('配置案がnullでなく、複数のチーム・拠点に対する割当情報を含むこと', async () => {
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal!.proposalId).toBeDefined();
    expect(result.placementProposal!.assignments).toBeInstanceOf(Array);
    expect(result.placementProposal!.assignments.length).toBeGreaterThan(0);

    result.placementProposal!.assignments.forEach((assignment) => {
      expect(assignment.workerId).toBeDefined();
      expect(assignment.currentDepartment).toBeDefined();
      expect(assignment.proposedDepartment).toBeDefined();
      expect(assignment.proposedWorkType).toBeDefined();
      expect(typeof assignment.skillMatchScore).toBe('number');
      expect(assignment.skillMatchScore).toBeGreaterThanOrEqual(0);
      expect(assignment.skillMatchScore).toBeLessThanOrEqual(100);
    });

    expect(result.placementProposal!.expectedProductivityImprovement).toBeGreaterThanOrEqual(0);
    expect(result.placementProposal!.generatedTimestamp).toBeInstanceOf(Date);
  });

  test('キャッシュ情報に検知時刻から30分以内のタイムスタンプと有効性情報を含むこと', async () => {
    const detectionTime = new Date();
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: detectionTime,
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.cacheUsageInfo).not.toBeNull();
    expect(result.cacheUsageInfo.cacheTimestamp).toBeInstanceOf(Date);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeLessThanOrEqual(30);
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThanOrEqual(0);
    expect(result.cacheUsageInfo.dataCompleteness).toBeLessThanOrEqual(100);

    const timeDiff = Math.abs(
      detectionTime.getTime() - result.cacheUsageInfo.cacheTimestamp.getTime()
    );
    expect(timeDiff).toBeLessThanOrEqual(30 * 60 * 1000);
  });

  test('通知対象者が影響を受ける拠点とチームに対応する3件以上の情報を含むこと', async () => {
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.notificationTargets.length).toBeGreaterThanOrEqual(3);

    const siteIdSet = new Set(result.notificationTargets.map((t) => t.siteId));
    expect(Array.from(siteIdSet)).toEqual(expect.arrayContaining(input.affectedSiteIds));

    result.notificationTargets.forEach((target) => {
      expect(input.affectedSiteIds.includes(target.siteId)).toBe(true);
      if (target.teamId) {
        expect(input.affectedTeamIds.includes(target.teamId)).toBe(true);
      }
    });
  });

  test('手動入力モード切り替えがtrueで、1件以上のターゲット情報を含むこと', async () => {
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.manualInputModeSwitched).toBe(true);
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(result.manualInputModeSwitchTargets!.length).toBeGreaterThanOrEqual(1);

    result.manualInputModeSwitchTargets!.forEach((target) => {
      expect(target.screenId).toBeDefined();
      expect(target.screenName).toBeDefined();
      expect(target.targetUserIds).toBeInstanceOf(Array);
      expect(target.targetUserIds.length).toBeGreaterThanOrEqual(1);
      target.targetUserIds.forEach((userId) => {
        expect(typeof userId).toBe('string');
      });
    });
  });

  test('errorDetailsに部分的欠損の詳細を含むエラー情報が1件以上あること', async () => {
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails!.length).toBeGreaterThanOrEqual(1);

    result.errorDetails!.forEach((error) => {
      expect(error.message).toBeDefined();
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });

    const timeoutOrCacheError = result.errorDetails!.some((error) =>
      /タイムアウト|timeout|キャッシュ|cache|partial|欠損|データ取得失敗/.test(error.message)
    );
    expect(timeoutOrCacheError).toBe(true);
  });

  test('executionTimestampが現在日時付近であること', async () => {
    const beforeExecution = new Date();
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'WMS-001',
      affectedSiteIds: ['SITE-A', 'SITE-B'],
      affectedTeamIds: ['TEAM-1', 'TEAM-2'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'USER-001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);
    const afterExecution = new Date();

    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(
      beforeExecution.getTime() - 1000
    );
    expect(result.executionTimestamp.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + 1000);
  });
});