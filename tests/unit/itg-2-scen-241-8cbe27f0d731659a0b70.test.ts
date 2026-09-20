import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-241: 収集対象データ項目として受注・在庫・入出荷・作業者実績が指定される', () => {
  it('should automatically determine data items, frequency, and priority for collection when delay risk is detected', () => {
    // Step 1: Create delay risk detection result
    const affectedSiteIds = Array.from({ length: 15 }, (_, i) => `site-${String(i + 1).padStart(3, '0')}`);
    const delayRiskScores: Record<string, number> = {};
    affectedSiteIds.forEach((siteId) => {
      delayRiskScores[siteId] = 0.6 + Math.random() * 0.3; // 0.6 ~ 0.9
    });

    const delayRiskDetectionResult = {
      affectedSiteIds,
      delayRiskScores,
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    // Step 2: Set collection context metadata
    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: 'High delay risk detected in multiple sites',
    };

    // Step 3: Set executing user ID
    const executingUserId = 'user_logistics_center_001';

    // Step 4: Call orchestrateDataCollectionForDelayRisk
    const result = orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    });

    // Step 5: Verify that all data items are included
    const allTargetSites = result.targetSiteIds;
    expect(allTargetSites.length).toBeGreaterThan(0);

    result.collectionScope.forEach((scope) => {
      expect(allTargetSites).toContain(scope.siteId);
      expect(scope.dataItems).toContain('orders');
      expect(scope.dataItems).toContain('inventory');
      expect(scope.dataItems).toContain('inbound');
      expect(scope.dataItems).toContain('outbound');
      expect(scope.dataItems).toContain('workerPerformance');
    });

    // Step 6: Verify frequency values
    result.collectionScope.forEach((scope) => {
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
    });

    // Step 7: Verify priority values
    result.collectionScope.forEach((scope) => {
      expect(scope.priority).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(scope.priority)).toBe(true);
    });

    // Step 8: Verify collection initiation status
    expect(result.collectionInitiationStatus).toBe('initiated');

    // Step 9: Verify estimated data availability time
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(
      result.orchestrationTimestamp.getTime()
    );

    // Expected Result Verification
    expect(result.collectionOrchestrationId).toBeTruthy();
    expect(typeof result.collectionOrchestrationId).toBe('string');
    expect(result.collectionOrchestrationId.length).toBeGreaterThan(0);

    expect(result.targetSiteIds).toBeDefined();
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds.length).toBeGreaterThan(0);

    expect(result.collectionScope).toBeDefined();
    expect(Array.isArray(result.collectionScope)).toBe(true);
    expect(result.collectionScope.length).toBe(result.targetSiteIds.length);

    result.collectionScope.forEach((scope, index) => {
      expect(scope.siteId).toBe(result.targetSiteIds[index]);
      expect(scope.dataItems).toEqual(
        expect.arrayContaining(['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'])
      );
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
      expect(scope.priority).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(scope.priority)).toBe(true);
    });

    expect(result.failedSiteIds).toEqual(
      result.failedSiteIds === undefined ? undefined : expect.arrayContaining([])
    );

    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
  });
});