import {
  orchestrateDataCollectionForDelayRisk,
  OrchestrateDataCollectionForDelayRiskInput,
  OrchestrateDataCollectionForDelayRiskOutput,
} from '../../src/logic/data-collection-orchestration';

describe('SCEN-230: Data Collection Orchestration for Delay Risk Detection', () => {
  describe('orchestrateDataCollectionForDelayRisk', () => {
    it('should correctly identify target sites and data items from delay risk detection results and initiate data collection', async () => {
      const now = new Date();
      const delayRiskDetectionResult = {
        affectedSiteIds: ['site-001', 'site-002', 'site-003'],
        delayRiskScores: {
          'site-001': 0.85,
          'site-002': 0.72,
          'site-003': 0.65,
        },
        detectionTimestamp: now,
        triggerSource: 'automated' as const,
      };

      const collectionContextMetadata = {
        busyPeriodFlag: true,
        workInstructionChangeDetected: true,
        contextDescription: 'Peak period detected',
      };

      const executingUserId = 'user-center-manager-001';

      const input: OrchestrateDataCollectionForDelayRiskInput = {
        delayRiskDetectionResult,
        executingUserId,
        collectionContextMetadata,
      };

      const result: OrchestrateDataCollectionForDelayRiskOutput = await orchestrateDataCollectionForDelayRisk(input);

      // (1) collectionOrchestrationId is a unique UUID format
      expect(result.collectionOrchestrationId).toBeDefined();
      expect(typeof result.collectionOrchestrationId).toBe('string');
      expect(result.collectionOrchestrationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      // (2) targetSiteIds is a subset of affectedSiteIds
      expect(result.targetSiteIds).toBeDefined();
      expect(Array.isArray(result.targetSiteIds)).toBe(true);
      expect(result.targetSiteIds.every((siteId) => delayRiskDetectionResult.affectedSiteIds.includes(siteId))).toBe(
        true
      );
      expect(result.targetSiteIds.length).toBeLessThanOrEqual(20);

      // (3) collectionScope contains required fields
      expect(result.collectionScope).toBeDefined();
      expect(Array.isArray(result.collectionScope)).toBe(true);
      result.collectionScope.forEach((scope) => {
        expect(scope.siteId).toBeDefined();
        expect(typeof scope.siteId).toBe('string');
        expect(Array.isArray(scope.dataItems)).toBe(true);
        expect(scope.frequency).toBeDefined();
        expect(scope.priority).toBeDefined();
        expect(typeof scope.priority).toBe('number');
      });

      // (4) dataItems only contains valid values
      const validDataItems = ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'];
      result.collectionScope.forEach((scope) => {
        scope.dataItems.forEach((item) => {
          expect(validDataItems).toContain(item);
        });
      });

      // (5) frequency is one of valid values
      const validFrequencies = ['realtime', 'every_5min', 'every_15min', 'hourly'];
      result.collectionScope.forEach((scope) => {
        expect(validFrequencies).toContain(scope.frequency);
      });

      // (6) priority is a positive integer
      result.collectionScope.forEach((scope) => {
        expect(scope.priority).toBeGreaterThan(0);
        expect(Number.isInteger(scope.priority)).toBe(true);
      });

      // (7) collectionInitiationStatus is 'initiated'
      expect(result.collectionInitiationStatus).toBe('initiated');

      // (8) failedSiteIds should not exist or be empty
      expect(result.failedSiteIds === undefined || result.failedSiteIds.length === 0).toBe(true);

      // (9) estimatedDataAvailabilityTime is within 60 seconds in the future
      expect(result.estimatedDataAvailabilityTime).toBeDefined();
      const timeDiff = result.estimatedDataAvailabilityTime.getTime() - now.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(0);
      expect(timeDiff).toBeLessThanOrEqual(60000);

      // (10) orchestrationTimestamp is approximately current time (within ±5 seconds)
      expect(result.orchestrationTimestamp).toBeDefined();
      const timestampDiff = Math.abs(result.orchestrationTimestamp.getTime() - now.getTime());
      expect(timestampDiff).toBeLessThanOrEqual(5000);
    });
  });
});