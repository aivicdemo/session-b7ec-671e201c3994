import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';
import * as dataCollectionOrchestration from '../../src/logic/data-collection-orchestration';

// Mock the internal functions
jest.mock('../../src/logic/data-collection-orchestration', () => {
  const actual = jest.requireActual('../../src/logic/data-collection-orchestration');
  return {
    ...actual,
    determineCollectionScope: jest.fn(),
    determineDataItemsAndFrequency: jest.fn(),
    prioritizeCollectionTargets: jest.fn(),
    synchronizeDataWithWESAndWMS: jest.fn(),
    handleDataRetrievalFailureAndGeneratePlacement: jest.fn(),
  };
});

describe('SCEN-245: データ収集の一部拠点で失敗した場合、partial_failure ステータスと失敗拠点IDが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock determineCollectionScope
    (dataCollectionOrchestration.determineCollectionScope as jest.Mock).mockResolvedValue({
      targetSiteIds: ['site-001', 'site-002', 'site-003', 'site-004', 'site-005'],
      scopeRationale: 'High risk scores detected',
    });

    // Mock determineDataItemsAndFrequency
    (dataCollectionOrchestration.determineDataItemsAndFrequency as jest.Mock).mockResolvedValue({
      dataItemsAndFrequencyBySite: [
        {
          siteId: 'site-001',
          dataItems: ['orders', 'inventory'],
          frequency: 'realtime' as const,
        },
        {
          siteId: 'site-002',
          dataItems: ['orders', 'inventory', 'inbound'],
          frequency: 'every_5min' as const,
        },
        {
          siteId: 'site-003',
          dataItems: ['orders', 'inventory'],
          frequency: 'realtime' as const,
        },
        {
          siteId: 'site-004',
          dataItems: ['outbound', 'workerPerformance'],
          frequency: 'every_15min' as const,
        },
        {
          siteId: 'site-005',
          dataItems: ['orders', 'inbound', 'outbound'],
          frequency: 'every_5min' as const,
        },
      ],
    });

    // Mock prioritizeCollectionTargets
    (dataCollectionOrchestration.prioritizeCollectionTargets as jest.Mock).mockResolvedValue({
      prioritizedCollectionScope: [
        {
          siteId: 'site-001',
          dataItems: ['orders', 'inventory'],
          frequency: 'realtime' as const,
          priority: 1,
        },
        {
          siteId: 'site-002',
          dataItems: ['orders', 'inventory', 'inbound'],
          frequency: 'every_5min' as const,
          priority: 2,
        },
        {
          siteId: 'site-003',
          dataItems: ['orders', 'inventory'],
          frequency: 'realtime' as const,
          priority: 1,
        },
        {
          siteId: 'site-004',
          dataItems: ['outbound', 'workerPerformance'],
          frequency: 'every_15min' as const,
          priority: 3,
        },
        {
          siteId: 'site-005',
          dataItems: ['orders', 'inbound', 'outbound'],
          frequency: 'every_5min' as const,
          priority: 2,
        },
      ],
    });

    // Mock synchronizeDataWithWESAndWMS to fail for site-001 and site-003
    (dataCollectionOrchestration.synchronizeDataWithWESAndWMS as jest.Mock).mockImplementation(
      async (siteId: string) => {
        if (siteId === 'site-001' || siteId === 'site-003') {
          const error = new Error('Data collection initiation failed');
          (error as any).name = 'DataCollectionInitiationFailedError';
          throw error;
        }
        return { success: true, siteId };
      }
    );

    // Mock handleDataRetrievalFailureAndGeneratePlacement
    (dataCollectionOrchestration.handleDataRetrievalFailureAndGeneratePlacement as jest.Mock).mockResolvedValue(
      {
        placementGenerated: true,
      }
    );
  });

  it('should return partial_failure status and failed site IDs when data collection fails for some sites', async () => {
    const input = {
      delayRiskDetectionResult: {
        affectedSiteIds: ['site-001', 'site-002', 'site-003', 'site-004', 'site-005'],
        delayRiskScores: {
          'site-001': 85,
          'site-002': 72,
          'site-003': 90,
          'site-004': 65,
          'site-005': 78,
        },
        detectionTimestamp: new Date('2024-01-15T10:30:00Z'),
        triggerSource: 'automated' as const,
      },
      executingUserId: 'user-admin-001',
      collectionContextMetadata: {
        busyPeriodFlag: true,
        workInstructionChangeDetected: false,
        contextDescription: 'Peak hour detected',
      },
    };

    const callTime = new Date();
    const result = await orchestrateDataCollectionForDelayRisk(input);
    const afterCallTime = new Date();

    expect(result.collectionInitiationStatus).toBe('partial_failure');
    expect(result.failedSiteIds).toBeDefined();
    expect(Array.isArray(result.failedSiteIds)).toBe(true);
    expect(result.failedSiteIds).toContain('site-001');
    expect(result.failedSiteIds).toContain('site-003');

    expect(result.targetSiteIds).toBeDefined();
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds.length).toBeGreaterThan(0);
    expect(result.targetSiteIds).not.toContain('site-001');
    expect(result.targetSiteIds).not.toContain('site-003');
    expect(result.targetSiteIds).toEqual(
      expect.arrayContaining(['site-002', 'site-004', 'site-005'])
    );

    expect(result.collectionOrchestrationId).toBeDefined();
    expect(typeof result.collectionOrchestrationId).toBe('string');
    expect(result.collectionOrchestrationId.length).toBeGreaterThan(0);

    expect(result.orchestrationTimestamp).toBeDefined();
    expect(result.orchestrationTimestamp instanceof Date).toBe(true);
    expect(result.orchestrationTimestamp.getTime()).toBeGreaterThanOrEqual(
      callTime.getTime()
    );
    expect(result.orchestrationTimestamp.getTime()).toBeLessThanOrEqual(
      afterCallTime.getTime()
    );

    expect(result.estimatedDataAvailabilityTime).toBeDefined();
    expect(result.estimatedDataAvailabilityTime instanceof Date).toBe(true);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(
      afterCallTime.getTime()
    );

    expect(result.collectionScope).toBeDefined();
    expect(Array.isArray(result.collectionScope)).toBe(true);
    result.collectionScope.forEach((scope) => {
      expect(['site-002', 'site-004', 'site-005']).toContain(scope.siteId);
      expect(scope.siteId).toBeDefined();
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      expect(scope.frequency).toBeDefined();
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(
        scope.frequency
      );
      expect(typeof scope.priority).toBe('number');
      expect(scope.priority).toBeGreaterThanOrEqual(1);
    });
  });
});