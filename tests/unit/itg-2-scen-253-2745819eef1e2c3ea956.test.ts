import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-253: オーケストレーション実行の開始時刻が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record orchestrationTimestamp when executing data collection orchestration for delay risk', async () => {
    const detectionTimestamp = new Date(Date.now() - 5000);

    const mockInput = {
      delayRiskDetectionResult: {
        affectedSiteIds: ['SITE-001', 'SITE-002', 'SITE-003'],
        delayRiskScores: {
          'SITE-001': 85,
          'SITE-002': 72,
          'SITE-003': 60,
        },
        detectionTimestamp: detectionTimestamp,
        triggerSource: 'automated' as const,
      },
      executingUserId: 'USER-12345',
    };

    const executionStartTime = new Date();

    const result = await orchestrateDataCollectionForDelayRisk(mockInput, {} as any);

    const executionEndTime = new Date();

    expect(result.orchestrationTimestamp).toBeDefined();
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
    expect(result.orchestrationTimestamp.getTime()).toBeGreaterThanOrEqual(
      executionStartTime.getTime()
    );
    expect(result.orchestrationTimestamp.getTime()).toBeLessThanOrEqual(
      executionEndTime.getTime()
    );
    expect(result.orchestrationTimestamp.getTime()).toBeGreaterThan(
      mockInput.delayRiskDetectionResult.detectionTimestamp.getTime()
    );

    expect(result.collectionOrchestrationId).toBeDefined();
    expect(typeof result.collectionOrchestrationId).toBe('string');

    expect(result.targetSiteIds).toBeDefined();
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds.length).toBeGreaterThan(0);
    result.targetSiteIds.forEach((siteId) => {
      expect(typeof siteId).toBe('string');
    });

    expect(result.collectionScope).toBeDefined();
    expect(Array.isArray(result.collectionScope)).toBe(true);
    expect(result.collectionScope.length).toBeGreaterThan(0);
    result.collectionScope.forEach((scope) => {
      expect(typeof scope.siteId).toBe('string');
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(
        scope.frequency
      );
      expect(typeof scope.priority).toBe('number');
      expect(scope.priority).toBeGreaterThan(0);
    });

    expect(result.collectionInitiationStatus).toBeDefined();
    expect(['initiated', 'partial_failure', 'failed']).toContain(
      result.collectionInitiationStatus
    );

    expect(result.estimatedDataAvailabilityTime).toBeDefined();
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
  });
});