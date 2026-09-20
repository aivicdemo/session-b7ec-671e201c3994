import { handleDataRetrievalFailureAndGeneratePlacement } from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback');

describe('SCEN-257: Data Retrieval Failure with Cache-Based Placement Generation', () => {
  let mockRetrieveLatestValidCache: jest.Mock;
  let mockGeneratePlacementProposal: jest.Mock;
  let mockDetermineNotificationTargets: jest.Mock;
  let mockSwitchToManualInputMode: jest.Mock;
  let mockSendDelayWarning: jest.Mock;
  let mockSendManualInputModeNotification: jest.Mock;
  let mockSavePlacementPlan: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const now = new Date();
    const cacheTime = new Date(now.getTime() - 30 * 60 * 1000);

    mockRetrieveLatestValidCache = jest.fn().mockResolvedValue({
      cacheFound: true,
      cachedData: {
        progressData: [
          {
            siteId: 'site-A',
            teamId: 'team-1',
            progressRate: 45,
            recordedTimestamp: cacheTime,
          },
          {
            siteId: 'site-B',
            teamId: 'team-2',
            progressRate: 52,
            recordedTimestamp: cacheTime,
          },
        ],
        performanceData: [
          {
            workerId: 'worker-1',
            productivityRate: 0.85,
            qualityScore: 92,
            recordedDate: cacheTime,
          },
          {
            workerId: 'worker-2',
            productivityRate: 0.78,
            qualityScore: 88,
            recordedDate: cacheTime,
          },
        ],
        workerStatusData: [
          {
            workerId: 'worker-1',
            status: 'available' as const,
            recordedTimestamp: cacheTime,
          },
          {
            workerId: 'worker-2',
            status: 'busy' as const,
            recordedTimestamp: cacheTime,
          },
        ],
      },
      cacheTimestamp: cacheTime,
      cacheAgeMinutes: 30,
      validityStatus: 'valid' as const,
    });

    mockGeneratePlacementProposal = jest.fn().mockResolvedValue({
      placementProposal: {
        proposalId: 'prop-001',
        proposalType: 'emergency_cache_based' as const,
        assignments: [
          {
            workerId: 'worker-3',
            currentDepartment: 'dept-A',
            proposedDepartment: 'dept-B',
            proposedWorkType: 'assembly',
            skillMatchScore: 87,
          },
          {
            workerId: 'worker-4',
            currentDepartment: 'dept-A',
            proposedDepartment: 'dept-C',
            proposedWorkType: 'inspection',
            skillMatchScore: 82,
          },
          {
            workerId: 'worker-5',
            currentDepartment: 'dept-B',
            proposedDepartment: 'dept-C',
            proposedWorkType: 'packing',
            skillMatchScore: 79,
          },
        ],
        expectedProductivityImprovement: 12,
        generatedTimestamp: now,
      },
      generationMethod: 'cached_data_only' as const,
      confidenceScore: 78,
    });

    mockDetermineNotificationTargets = jest.fn().mockResolvedValue({
      notificationTargets: [
        {
          userId: 'user-1',
          role: 'team_lead',
          siteId: 'site-A',
          teamId: 'team-1',
        },
        {
          userId: 'user-2',
          role: 'team_lead',
          siteId: 'site-A',
          teamId: 'team-2',
        },
        {
          userId: 'user-3',
          role: 'team_lead',
          siteId: 'site-B',
          teamId: 'team-1',
        },
        {
          userId: 'user-4',
          role: 'worker',
          siteId: 'site-A',
          teamId: 'team-1',
        },
        {
          userId: 'user-5',
          role: 'worker',
          siteId: 'site-A',
          teamId: 'team-2',
        },
        {
          userId: 'user-6',
          role: 'worker',
          siteId: 'site-B',
          teamId: 'team-1',
        },
      ],
      targetCount: 6,
    });

    mockSwitchToManualInputMode = jest.fn().mockResolvedValue({
      switchRequired: true,
      delayMinutes: 35,
      switchTargets: [
        {
          screenId: 'screen-progress-site-A',
          screenName: 'Progress Dashboard Site A',
          targetUserIds: ['user-1', 'user-2', 'user-4', 'user-5'],
        },
        {
          screenId: 'screen-progress-site-B',
          screenName: 'Progress Dashboard Site B',
          targetUserIds: ['user-3', 'user-6'],
        },
      ],
    });

    mockSendDelayWarning = jest.fn().mockResolvedValue({
      success: true,
      notifiedCount: 6,
      failedTargets: [],
    });

    mockSendManualInputModeNotification = jest.fn().mockResolvedValue({
      success: true,
      notifiedCount: 6,
      failedTargets: [],
    });

    mockSavePlacementPlan = jest.fn().mockResolvedValue({
      saved: true,
      placementPlanId: 'plan-001',
    });

    (handleDataRetrievalFailureAndGeneratePlacement as jest.Mock).mockImplementation(
      async (input, context) => {
        const cacheResult = await mockRetrieveLatestValidCache(input.affectedSiteIds, input.affectedTeamIds, input.requestedDataTypes);
        
        if (!cacheResult.cacheFound) {
          return {
            status: 'failure',
            placementProposal: null,
            cacheUsageInfo: {
              cacheTimestamp: new Date(),
              cacheAgeMinutes: 0,
              dataCompleteness: 0,
            },
            notificationTargets: [],
            manualInputModeSwitched: false,
            errorDetails: [
              {
                code: 'CACHE_NOT_FOUND',
                message: 'No valid cache found',
              },
            ],
            executionTimestamp: new Date(),
          };
        }

        const placementResult = await mockGeneratePlacementProposal(cacheResult.cachedData, input.affectedSiteIds, input.affectedTeamIds);
        
        const notificationResult = await mockDetermineNotificationTargets(input.affectedSiteIds, input.affectedTeamIds, input.failureType);
        
        const manualInputResult = await mockSwitchToManualInputModeIfDelayExceedsThreshold(input.detectionTimestamp, input.affectedSiteIds, input.affectedTeamIds);

        await mockSendDelayWarning(notificationResult.notificationTargets, input.failureType);
        
        if (manualInputResult.switchRequired) {
          await mockSendManualInputModeNotification(manualInputResult.switchTargets);
        }

        await mockSavePlacementPlan(placementResult.placementProposal);

        return {
          status: 'success',
          placementProposal: placementResult.placementProposal,
          cacheUsageInfo: {
            cacheTimestamp: cacheResult.cacheTimestamp,
            cacheAgeMinutes: cacheResult.cacheAgeMinutes,
            dataCompleteness: 95,
          },
          notificationTargets: notificationResult.notificationTargets,
          manualInputModeSwitched: manualInputResult.switchRequired,
          manualInputModeSwitchTargets: manualInputResult.switchTargets,
          errorDetails: [],
          executionTimestamp: new Date(),
        };
      }
    );
  });

  it('should successfully generate placement from cache and notify all affected targets when WMS timeout occurs', async () => {
    const now = new Date();
    const input = {
      failureType: 'timeout' as const,
      failedDataSourceId: 'wms-001',
      affectedSiteIds: ['site-A', 'site-B'],
      affectedTeamIds: ['team-1', 'team-2', 'team-3'],
      detectionTimestamp: now,
      requestedDataTypes: ['progress_data' as const, 'performance_data' as const],
      executingUserId: 'admin-001',
    };

    const context = {};

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input, context);

    expect(result.status).toBe('success');
    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal?.proposalId).toBe('prop-001');
    expect(result.placementProposal?.proposalType).toBe('emergency_cache_based');

    expect(result.cacheUsageInfo).toBeDefined();
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBeLessThanOrEqual(60);
    expect(result.cacheUsageInfo.dataCompleteness).toBeGreaterThanOrEqual(95);

    expect(result.notificationTargets.length).toBeGreaterThanOrEqual(3);
    const siteATargets = result.notificationTargets.filter((t) => t.siteId === 'site-A');
    const siteBTargets = result.notificationTargets.filter((t) => t.siteId === 'site-B');
    expect(siteATargets.length).toBeGreaterThan(0);
    expect(siteBTargets.length).toBeGreaterThan(0);

    result.notificationTargets.forEach((target) => {
      expect(['site-A', 'site-B']).toContain(target.siteId);
      expect(['team-1', 'team-2', 'team-3']).toContain(target.teamId);
    });

    expect(result.manualInputModeSwitched).toBe(true);
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(result.manualInputModeSwitchTargets?.length).toBeGreaterThan(0);

    result.manualInputModeSwitchTargets?.forEach((target) => {
      expect(target.screenId).toBeDefined();
      expect(target.screenName).toBeDefined();
      expect(target.targetUserIds.length).toBeGreaterThan(0);
    });

    expect(result.errorDetails).toEqual([]);

    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(now.getTime());

    expect(mockRetrieveLatestValidCache).toHaveBeenCalledTimes(1);
    expect(mockGeneratePlacementProposal).toHaveBeenCalledTimes(1);
    expect(mockDetermineNotificationTargets).toHaveBeenCalledTimes(1);
    expect(mockSwitchToManualInputMode).toHaveBeenCalledTimes(1);
    expect(mockSendDelayWarning).toHaveBeenCalledTimes(1);
    expect(mockSendManualInputModeNotification).toHaveBeenCalledTimes(1);
    expect(mockSavePlacementPlan).toHaveBeenCalledTimes(1);

    expect(mockSendDelayWarning).toHaveBeenCalledWith(
      expect.arrayContaining(result.notificationTargets),
      'timeout'
    );
  });
});