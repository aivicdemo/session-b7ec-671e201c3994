import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-249: メタデータが省略された場合でも処理が完了する', () => {
  it('collectionContextMetadata が null の場合、正常に処理が完了する', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['site-001', 'site-002', 'site-003'],
      delayRiskScores: {
        'site-001': 0.85,
        'site-002': 0.72,
        'site-003': 0.65,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };
    const executingUserId = 'user-12345';

    // Act
    const result = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata: null,
    });

    // Assert
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.collectionOrchestrationId)).toBe(true);

    expect(result.targetSiteIds).toBeDefined();
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds).toContain('site-001');
    expect(result.targetSiteIds).toContain('site-002');
    expect(result.targetSiteIds).toContain('site-003');

    expect(result.collectionScope).toBeDefined();
    expect(Array.isArray(result.collectionScope)).toBe(true);
    expect(result.collectionScope.length).toBeGreaterThan(0);

    result.collectionScope.forEach((scope) => {
      expect(scope.siteId).toBeDefined();
      expect(['site-001', 'site-002', 'site-003']).toContain(scope.siteId);
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      scope.dataItems.forEach((item) => {
        expect(['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance']).toContain(item);
      });
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
      expect(typeof scope.priority).toBe('number');
      expect(scope.priority).toBeGreaterThan(0);
    });

    expect(['initiated', 'partial_failure', 'failed']).toContain(result.collectionInitiationStatus);

    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(new Date().getTime());

    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
    expect(Math.abs(result.orchestrationTimestamp.getTime() - new Date().getTime())).toBeLessThan(60000);
  });

  it('collectionContextMetadata が undefined の場合、正常に処理が完了する', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['site-001', 'site-002', 'site-003'],
      delayRiskScores: {
        'site-001': 0.85,
        'site-002': 0.72,
        'site-003': 0.65,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };
    const executingUserId = 'user-12345';

    // Act
    const result = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata: undefined,
    });

    // Assert
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.collectionOrchestrationId)).toBe(true);

    expect(result.targetSiteIds).toBeDefined();
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    expect(result.targetSiteIds.length).toBeGreaterThan(0);

    expect(result.collectionScope).toBeDefined();
    expect(Array.isArray(result.collectionScope)).toBe(true);

    result.collectionScope.forEach((scope) => {
      expect(scope.siteId).toBeDefined();
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
      expect(typeof scope.priority).toBe('number');
    });

    expect(['initiated', 'partial_failure', 'failed']).toContain(result.collectionInitiationStatus);
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
  });

  it('collectionContextMetadata が省略された場合、collectionScope の各要素が有効な構造を持つ', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['site-001', 'site-002'],
      delayRiskScores: {
        'site-001': 0.90,
        'site-002': 0.75,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };
    const executingUserId = 'user-67890';

    // Act
    const result = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult,
      executingUserId,
    });

    // Assert
    expect(result.collectionScope).toBeDefined();
    result.collectionScope.forEach((scope) => {
      expect(scope).toHaveProperty('siteId');
      expect(scope).toHaveProperty('dataItems');
      expect(scope).toHaveProperty('frequency');
      expect(scope).toHaveProperty('priority');
      expect(typeof scope.siteId).toBe('string');
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(typeof scope.frequency).toBe('string');
      expect(typeof scope.priority).toBe('number');
    });
  });

  it('エラーがスロー されていないことを確認', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['site-001', 'site-002', 'site-003'],
      delayRiskScores: {
        'site-001': 0.85,
        'site-002': 0.72,
        'site-003': 0.65,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };
    const executingUserId = 'user-12345';

    // Act & Assert
    await expect(
      orchestrateDataCollectionForDelayRisk({
        delayRiskDetectionResult,
        executingUserId,
        collectionContextMetadata: null,
      })
    ).resolves.not.toThrow();
  });
});