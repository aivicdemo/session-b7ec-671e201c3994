import { jest } from '@jest/globals';
import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';
import * as dataCollectionModule from '../../src/logic/data-collection-orchestration';

describe('SCEN-246: orchestrateDataCollectionForDelayRisk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initiated status when all target sites receive data collection instructions successfully', async () => {
    // Step 1: Prepare delay risk detection result
    const affectedSiteIds = Array.from({ length: 10 }, (_, i) => `site${String(i + 1).padStart(3, '0')}`);;
    const delayRiskScores: Record<string, number> = {};
    affectedSiteIds.forEach((siteId, index) => {
      delayRiskScores[siteId] = 30 + (index * 5);
    });

    const delayRiskDetectionResult = {
      affectedSiteIds,
      delayRiskScores,
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    // Step 2: Prepare context metadata
    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: 'automated risk detection',
    };

    // Step 3: Construct input
    const executingUserId = 'user123';
    const input = {
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    };

    // Step 4: Stub determineCollectionScope
    const targetSiteIds = affectedSiteIds.slice(0, 10); // Top 10 sites by busyness score
    const determineCollectionScopeSpy = jest.spyOn(dataCollectionModule, 'determineCollectionScope' as any).mockResolvedValue({
      targetSiteIds,
      scopeRationale: 'Top 10 sites by delay risk score',
    });

    // Step 4: Stub determineDataItemsAndFrequency
    const dataItemsAndFrequencyBySite = targetSiteIds.map((siteId, index) => ({
      siteId,
      dataItems: ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'] as Array<'orders' | 'inventory' | 'inbound' | 'outbound' | 'workerPerformance'>,
      frequency: index % 2 === 0 ? ('realtime' as const) : ('every_5min' as const),
    }));

    const determineDataItemsAndFrequencySpy = jest.spyOn(dataCollectionModule, 'determineDataItemsAndFrequency' as any).mockResolvedValue({
      dataItemsAndFrequencyBySite,
    });

    // Step 4: Stub prioritizeCollectionTargets
    const prioritizedCollectionScope = dataItemsAndFrequencyBySite.map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

    const prioritizeCollectionTargetsSpy = jest.spyOn(dataCollectionModule, 'prioritizeCollectionTargets' as any).mockResolvedValue({
      prioritizedCollectionScope,
    });

    // Step 5: Stub synchronizeDataWithWESAndWMS
    const synchronizeDataWithWESAndWMSSpy = jest.spyOn(dataCollectionModule, 'synchronizeDataWithWESAndWMS' as any).mockResolvedValue({
      successCount: targetSiteIds.length,
      failureCount: 0,
      failedSiteIds: [],
    });

    // Step 6: Call orchestrateDataCollectionForDelayRisk
    const result = await orchestrateDataCollectionForDelayRisk(input);

    // Step 7: Verify return type
    expect(result).toBeDefined();
    expect(result).toHaveProperty('collectionOrchestrationId');
    expect(result).toHaveProperty('targetSiteIds');
    expect(result).toHaveProperty('collectionScope');
    expect(result).toHaveProperty('collectionInitiationStatus');
    expect(result).toHaveProperty('failedSiteIds');
    expect(result).toHaveProperty('estimatedDataAvailabilityTime');
    expect(result).toHaveProperty('orchestrationTimestamp');

    // Step 8: Verify collectionInitiationStatus is 'initiated'
    expect(result.collectionInitiationStatus).toBe('initiated');

    // Step 9: Verify targetSiteIds is not empty and is subset of affectedSiteIds
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds.length).toBeGreaterThan(0);
    expect(result.targetSiteIds.length).toBeLessThanOrEqual(20);
    expect(result.targetSiteIds.length).toBeLessThanOrEqual(affectedSiteIds.length);
    result.targetSiteIds.forEach((siteId) => {
      expect(affectedSiteIds).toContain(siteId);
    });

    // Step 10: Verify collectionScope array length matches targetSiteIds length
    expect(Array.isArray(result.collectionScope)).toBe(true);
    expect(result.collectionScope.length).toBe(result.targetSiteIds.length);

    // Step 11: Verify each collectionScope element has valid structure
    const validDataItems = ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'];
    const validFrequencies = ['realtime', 'every_5min', 'every_15min', 'hourly'];

    result.collectionScope.forEach((scope) => {
      expect(result.targetSiteIds).toContain(scope.siteId);

      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      scope.dataItems.forEach((item) => {
        expect(validDataItems).toContain(item);
      });

      expect(validFrequencies).toContain(scope.frequency);

      expect(typeof scope.priority).toBe('number');
      expect(scope.priority).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(scope.priority)).toBe(true);
    });

    // Step 12: Verify failedSiteIds is undefined or empty
    expect(result.failedSiteIds === undefined || Array.isArray(result.failedSiteIds)).toBe(true);
    if (Array.isArray(result.failedSiteIds)) {
      expect(result.failedSiteIds.length).toBe(0);
    }

    // Step 13: Verify collectionOrchestrationId is non-empty string
    expect(typeof result.collectionOrchestrationId).toBe('string');
    expect(result.collectionOrchestrationId.length).toBeGreaterThan(0);

    // Step 14: Verify orchestrationTimestamp is valid Date
    expect(result.orchestrationTimestamp instanceof Date).toBe(true);
    expect(isNaN(result.orchestrationTimestamp.getTime())).toBe(false);

    // Step 15: Verify estimatedDataAvailabilityTime is after orchestrationTimestamp
    expect(result.estimatedDataAvailabilityTime instanceof Date).toBe(true);
    expect(isNaN(result.estimatedDataAvailabilityTime.getTime())).toBe(false);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(
      result.orchestrationTimestamp.getTime()
    );

    // Verify stubs were called
    expect(determineCollectionScopeSpy).toHaveBeenCalled();
    expect(determineDataItemsAndFrequencySpy).toHaveBeenCalled();
    expect(prioritizeCollectionTargetsSpy).toHaveBeenCalled();
    expect(synchronizeDataWithWESAndWMSSpy).toHaveBeenCalled();
  });
});