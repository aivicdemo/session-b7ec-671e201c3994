import { handleDataRetrievalFailureAndGeneratePlacement } from '../../src/logic/data-retrieval-fallback';
import * as dataRetrievalFallback from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => ({
  ...jest.requireActual('../../src/logic/data-retrieval-fallback'),
  determineDataRetrievalDelayNotificationTargets: jest.fn(),
  switchToManualInputModeIfDelayExceedsThreshold: jest.fn(),
  retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
  generatePlacementProposalFromCachedData: jest.fn(),
  sendDataTransmissionDelayWarning: jest.fn(),
  sendManualInputModeSwitchNotification: jest.fn(),
  savePlacementPlan: jest.fn(),
}));

describe('SCEN-262: 手動入力モード切り替えが成功した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockNotificationTargets = [
      {
        userId: 'USER-NTF-001',
        role: 'site_manager',
        siteId: 'SITE001',
        teamId: 'TEAM001',
      },
      {
        userId: 'USER-NTF-002',
        role: 'team_leader',
        siteId: 'SITE001',
        teamId: 'TEAM001',
      },
    ];

    (dataRetrievalFallback.determineDataRetrievalDelayNotificationTargets as jest.Mock).mockImplementation(
      (input) => {
        if (
          JSON.stringify(input.affectedSiteIds) === JSON.stringify(['SITE001']) &&
          JSON.stringify(input.affectedTeamIds) === JSON.stringify(['TEAM001'])
        ) {
          return Promise.resolve({
            notificationTargets: mockNotificationTargets,
            targetCount: mockNotificationTargets.length,
          });
        }
        return Promise.resolve({
          notificationTargets: [],
          targetCount: 0,
        });
      }
    );

    const mockSwitchTargets = [
      {
        screenId: 'screen-manual-input-001',
        screenName: 'Manual Input Screen - SITE001',
        targetUserIds: ['USER-NTF-001', 'USER-NTF-002'],
      },
    ];

    (dataRetrievalFallback.switchToManualInputModeIfDelayExceedsThreshold as jest.Mock).mockResolvedValue({
      switchRequired: true,
      delayMinutes: 45,
      switchTargets: mockSwitchTargets,
    });

    const mockCacheData = {
      progressData: [
        {
          siteId: 'SITE001',
          teamId: 'TEAM001',
          progressRate: 65,
          recordedTimestamp: new Date(Date.now() - 10 * 60000),
        },
      ],
      performanceData: [
        {
          workerId: 'WORKER-001',
          productivityRate: 0.85,
          qualityScore: 92,
          recordedDate: new Date(Date.now() - 60000),
        },
      ],
    };

    (dataRetrievalFallback.retrieveLatestValidCacheForPlacementGeneration as jest.Mock).mockResolvedValue({
      cacheFound: true,
      cachedData: mockCacheData,
      cacheTimestamp: new Date(Date.now() - 10 * 60000),
      cacheAgeMinutes: 10,
      validityStatus: 'valid',
    });

    const mockPlacementProposal = {
      proposalId: 'PROPOSAL-001',
      proposalType: 'emergency_cache_based' as const,
      assignments: [
        {
          workerId: 'WORKER-001',
          currentDepartment: 'Assembly',
          proposedDepartment: 'Packing',
          proposedWorkType: 'High-Priority-Task',
          skillMatchScore: 88,
        },
      ],
      expectedProductivityImprovement: 15,
      generatedTimestamp: new Date(),
    };

    (dataRetrievalFallback.generatePlacementProposalFromCachedData as jest.Mock).mockResolvedValue({
      placementProposal: mockPlacementProposal,
      generationMethod: 'cached_data_only' as const,
      confidenceScore: 82,
    });

    (dataRetrievalFallback.sendDataTransmissionDelayWarning as jest.Mock).mockResolvedValue({
      success: true,
      notificationsSent: 2,
    });

    (dataRetrievalFallback.sendManualInputModeSwitchNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationsSent: 2,
    });

    (dataRetrievalFallback.savePlacementPlan as jest.Mock).mockResolvedValue({
      success: true,
      planId: 'PLAN-001',
    });
  });

  it('manualInputModeSwitchedがtrueで手動入力モード切り替え対象者情報を返す', async () => {
    const input = {
      failureType: 'timeout' as const,
      failedDataSourceId: 'WMS001',
      affectedSiteIds: ['SITE001'],
      affectedTeamIds: ['TEAM001'],
      detectionTimestamp: new Date(),
      requestedDataTypes: ['progress_data', 'performance_data'] as const[],
      executingUserId: 'USER001',
    };

    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    expect(result.status).toBe('success');
    expect(result.manualInputModeSwitched).toBe(true);
    expect(result.manualInputModeSwitchTargets).toBeDefined();
    expect(Array.isArray(result.manualInputModeSwitchTargets)).toBe(true);
    expect(result.manualInputModeSwitchTargets!.length).toBeGreaterThan(0);
    
    result.manualInputModeSwitchTargets!.forEach((target) => {
      expect(target.screenId).toBeDefined();
      expect(typeof target.screenId).toBe('string');
      expect(target.screenName).toBeDefined();
      expect(typeof target.screenName).toBe('string');
      expect(target.targetUserIds).toBeDefined();
      expect(Array.isArray(target.targetUserIds)).toBe(true);
      expect(target.targetUserIds.length).toBeGreaterThan(0);
    });

    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal).toBeDefined();
    expect(result.placementProposal!.proposalId).toBeDefined();
    expect(result.placementProposal!.assignments).toBeDefined();
    expect(Array.isArray(result.placementProposal!.assignments)).toBe(true);

    expect(result.cacheUsageInfo).toBeDefined();
    expect(result.cacheUsageInfo.cacheTimestamp).toBeInstanceOf(Date);
    expect(typeof result.cacheUsageInfo.cacheAgeMinutes).toBe('number');
    expect(typeof result.cacheUsageInfo.dataCompleteness).toBe('number');

    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBeGreaterThan(0);

    result.notificationTargets.forEach((target) => {
      expect(target.userId).toBeDefined();
      expect(target.role).toBeDefined();
      expect(target.siteId).toBeDefined();
    });

    expect(result.executionTimestamp).toBeInstanceOf(Date);
    const timeDiff = Math.abs(result.executionTimestamp.getTime() - new Date().getTime());
    expect(timeDiff).toBeLessThan(5000);

    if (result.errorDetails !== undefined) {
      expect(Array.isArray(result.errorDetails)).toBe(true);
    }
  });
});