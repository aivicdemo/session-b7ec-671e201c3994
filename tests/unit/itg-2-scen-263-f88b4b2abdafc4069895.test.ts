import {
  handleDataRetrievalFailureAndGeneratePlacement,
  HandleDataRetrievalFailureAndGeneratePlacementInput,
  HandleDataRetrievalFailureAndGeneratePlacementOutput,
  RetrieveLatestValidCacheForPlacementGenerationOutput,
  GeneratePlacementProposalFromCachedDataOutput,
  DetermineDataRetrievalDelayNotificationTargetsOutput,
  SwitchToManualInputModeIfDelayExceedsThresholdOutput,
  CachedDataSet,
  ProgressDataRecord,
  PerformanceDataRecord,
  PlacementProposal,
  PlacementAssignment,
  NotificationTarget,
  CacheUsageInfo,
  ManualInputModeSwitchTarget,
} from '../../src/logic/data-retrieval-fallback';

jest.mock('../../src/logic/data-retrieval-fallback', () => {
  const actual = jest.requireActual('../../src/logic/data-retrieval-fallback');
  return {
    ...actual,
    retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
    generatePlacementProposalFromCachedData: jest.fn(),
    determineDataRetrievalDelayNotificationTargets: jest.fn(),
    switchToManualInputModeIfDelayExceedsThreshold: jest.fn(),
    sendDataTransmissionDelayWarning: jest.fn(),
    sendManualInputModeSwitchNotification: jest.fn(),
    savePlacementPlan: jest.fn(),
  };
});

describe('SCEN-263: handleDataRetrievalFailureAndGeneratePlacement', () => {
  let retrieveLatestValidCacheMock: jest.Mock;
  let generatePlacementProposalMock: jest.Mock;
  let determineNotificationTargetsMock: jest.Mock;
  let switchToManualInputModeMock: jest.Mock;
  let sendDelayWarningMock: jest.Mock;
  let sendManualInputModeSwitchMock: jest.Mock;
  let savePlacementPlanMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockModule = require('../../src/logic/data-retrieval-fallback');
    retrieveLatestValidCacheMock = mockModule.retrieveLatestValidCacheForPlacementGeneration;
    generatePlacementProposalMock = mockModule.generatePlacementProposalFromCachedData;
    determineNotificationTargetsMock = mockModule.determineDataRetrievalDelayNotificationTargets;
    switchToManualInputModeMock = mockModule.switchToManualInputModeIfDelayExceedsThreshold;
    sendDelayWarningMock = mockModule.sendDataTransmissionDelayWarning;
    sendManualInputModeSwitchMock = mockModule.sendManualInputModeSwitchNotification;
    savePlacementPlanMock = mockModule.savePlacementPlan;
  });

  it('should return manualInputModeSwitched=false when delay is below threshold', async () => {
    // Arrange
    const input: HandleDataRetrievalFailureAndGeneratePlacementInput = {
      failureType: 'timeout',
      failedDataSourceId: 'wms-01',
      affectedSiteIds: ['site-A', 'site-B'],
      affectedTeamIds: ['team-1', 'team-2'],
      detectionTimestamp: new Date('2024-01-15T10:30:00Z'),
      requestedDataTypes: ['progress_data', 'performance_data'],
      executingUserId: 'user-001',
    };

    const now = new Date('2024-01-15T10:30:00Z');
    const cacheTimestamp = new Date('2024-01-15T10:25:00Z');

    const mockCacheData: CachedDataSet = {
      progressData: [
        {
          siteId: 'site-A',
          teamId: 'team-1',
          progressRate: 75,
          recordedTimestamp: cacheTimestamp,
        } as ProgressDataRecord,
      ],
      performanceData: [
        {
          workerId: 'worker-1',
          productivityRate: 0.95,
          qualityScore: 90,
          recordedDate: cacheTimestamp,
        } as PerformanceDataRecord,
      ],
    };

    const mockCacheUsageInfo: CacheUsageInfo = {
      cacheTimestamp,
      cacheAgeMinutes: 5,
      dataCompleteness: 100,
    };

    const mockPlacementProposal: PlacementProposal = {
      proposalId: 'prop-001',
      proposalType: 'emergency_cache_based',
      assignments: [
        {
          workerId: 'worker-1',
          currentDepartment: 'dept-A',
          proposedDepartment: 'dept-B',
          proposedWorkType: 'assembly',
          skillMatchScore: 85,
        } as PlacementAssignment,
      ],
      expectedProductivityImprovement: 15,
      generatedTimestamp: now,
    };

    const mockNotificationTargets: NotificationTarget[] = [
      {
        userId: 'leader-1',
        role: 'team_leader',
        siteId: 'site-A',
        teamId: 'team-1',
      } as NotificationTarget,
      {
        userId: 'leader-2',
        role: 'team_leader',
        siteId: 'site-B',
        teamId: 'team-2',
      } as NotificationTarget,
    ];

    retrieveLatestValidCacheMock.mockResolvedValue({
      cacheFound: true,
      cachedData: mockCacheData,
      cacheTimestamp,
      cacheAgeMinutes: 5,
      validityStatus: 'valid',
    } as RetrieveLatestValidCacheForPlacementGenerationOutput);

    generatePlacementProposalMock.mockResolvedValue({
      placementProposal: mockPlacementProposal,
      generationMethod: 'cached_data_only',
      confidenceScore: 82,
    } as GeneratePlacementProposalFromCachedDataOutput);

    determineNotificationTargetsMock.mockResolvedValue({
      notificationTargets: mockNotificationTargets,
      targetCount: 2,
    } as DetermineDataRetrievalDelayNotificationTargetsOutput);

    switchToManualInputModeMock.mockResolvedValue({
      switchRequired: false,
      delayMinutes: 5,
      switchTargets: undefined,
    } as SwitchToManualInputModeIfDelayExceedsThresholdOutput);

    sendDelayWarningMock.mockResolvedValue({ success: true });
    sendManualInputModeSwitchMock.mockResolvedValue({ success: true });
    savePlacementPlanMock.mockResolvedValue({ saved: true });

    // Act
    const result = await handleDataRetrievalFailureAndGeneratePlacement(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.manualInputModeSwitched).toBe(false);
    expect(result.status).toBe('success');
    expect(result.placementProposal).not.toBeNull();
    expect(result.placementProposal?.proposalId).toBe('prop-001');
    expect(result.cacheUsageInfo).not.toBeNull();
    expect(result.cacheUsageInfo.cacheAgeMinutes).toBe(5);
    expect(result.notificationTargets.length).toBeGreaterThan(0);
    expect(result.notificationTargets.length).toBe(2);
    expect(
      result.manualInputModeSwitchTargets === undefined ||
        result.manualInputModeSwitchTargets.length === 0
    ).toBe(true);

    expect(retrieveLatestValidCacheMock).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedSiteIds: ['site-A', 'site-B'],
        affectedTeamIds: ['team-1', 'team-2'],
        requestedDataTypes: ['progress_data', 'performance_data'],
      })
    );

    expect(generatePlacementProposalMock).toHaveBeenCalled();
    expect(determineNotificationTargetsMock).toHaveBeenCalled();
    expect(switchToManualInputModeMock).toHaveBeenCalled();
    expect(sendDelayWarningMock).toHaveBeenCalled();
    expect(sendManualInputModeSwitchMock).not.toHaveBeenCalled();
    expect(savePlacementPlanMock).toHaveBeenCalled();
  });
});