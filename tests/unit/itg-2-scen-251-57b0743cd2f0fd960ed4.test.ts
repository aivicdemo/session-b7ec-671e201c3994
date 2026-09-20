import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-251: オーケストレーション実行の一意識別子が生成される', () => {
  it('should generate a unique orchestrationId and initialize data collection with correct structure', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['SITE001', 'SITE002', 'SITE003'],
      delayRiskScores: {
        'SITE001': 75,
        'SITE002': 60,
        'SITE003': 45,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    const executingUserId = 'USER_CENTER_MANAGER_001';

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: '午前ピーク時の進捗遅延',
    };

    const input = {
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    };

    // Act
    const result = await orchestrateDataCollectionForDelayRisk(input);

    // Assert - collectionOrchestrationId validation
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(typeof result.collectionOrchestrationId).toBe('string');
    expect(result.collectionOrchestrationId.length).toBeGreaterThan(0);

    // Act - Call again to verify uniqueness
    const result2 = await orchestrateDataCollectionForDelayRisk(input);

    // Assert - Verify uniqueness
    expect(result2.collectionOrchestrationId).not.toBe(result.collectionOrchestrationId);

    // Assert - targetSiteIds validation
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds.length).toBeGreaterThan(0);
    expect(result.targetSiteIds.length).toBeLessThanOrEqual(20);

    // Assert - collectionScope validation
    expect(Array.isArray(result.collectionScope)).toBe(true);
    expect(result.collectionScope.length).toBeGreaterThan(0);

    result.collectionScope.forEach((scope) => {
      expect(scope.siteId).toBeDefined();
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      scope.dataItems.forEach((item) => {
        expect(['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance']).toContain(item);
      });
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
      expect(typeof scope.priority).toBe('number');
      expect(scope.priority).toBeGreaterThanOrEqual(1);
    });

    // Assert - collectionInitiationStatus validation
    expect(['initiated', 'partial_failure', 'failed']).toContain(result.collectionInitiationStatus);

    // Assert - estimatedDataAvailabilityTime validation
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);

    // Assert - orchestrationTimestamp validation
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
    expect(result.orchestrationTimestamp.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
  });

  it('should prioritize affected sites based on delay risk scores', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['SITE001', 'SITE002', 'SITE003'],
      delayRiskScores: {
        'SITE001': 75,
        'SITE002': 60,
        'SITE003': 45,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    const executingUserId = 'USER_CENTER_MANAGER_001';

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: '午前ピーク時の進捗遅延',
    };

    const input = {
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    };

    // Act
    const result = await orchestrateDataCollectionForDelayRisk(input);

    // Assert - Verify affected sites are included in target sites
    expect(result.targetSiteIds).toContain('SITE001');
    expect(result.targetSiteIds).toContain('SITE002');
    expect(result.targetSiteIds).toContain('SITE003');

    // Assert - Verify priority assignment based on risk scores
    const siteScopes = new Map(result.collectionScope.map((scope) => [scope.siteId, scope]));
    const site001Priority = siteScopes.get('SITE001')?.priority;
    const site002Priority = siteScopes.get('SITE002')?.priority;
    const site003Priority = siteScopes.get('SITE003')?.priority;

    if (site001Priority && site002Priority && site003Priority) {
      expect(site001Priority).toBeLessThanOrEqual(site002Priority);
      expect(site002Priority).toBeLessThanOrEqual(site003Priority);
    }
  });

  it('should include data items and frequency based on busy period flag', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['SITE001'],
      delayRiskScores: {
        'SITE001': 75,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    const executingUserId = 'USER_CENTER_MANAGER_001';

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: '午前ピーク時の進捗遅延',
    };

    const input = {
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    };

    // Act
    const result = await orchestrateDataCollectionForDelayRisk(input);

    // Assert - Verify collectionScope contains appropriate data items for busy period
    expect(result.collectionScope.length).toBeGreaterThan(0);

    const busyPeriodScopes = result.collectionScope.filter((scope) =>
      delayRiskDetectionResult.affectedSiteIds.includes(scope.siteId),
    );

    busyPeriodScopes.forEach((scope) => {
      expect(scope.dataItems.length).toBeGreaterThan(0);
      const frequencyPriority = { realtime: 1, every_5min: 2, every_15min: 3, hourly: 4 };
      expect(frequencyPriority[scope.frequency]).toBeLessThanOrEqual(2);
    });
  });
});