import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-248: 繁忙期フラグと作業指示変更検知フラグが処理に反映される', () => {
  it('should apply busy period and work instruction change flags to collection scope determination', async () => {
    // Arrange
    const input = {
      delayRiskDetectionResult: {
        affectedSiteIds: ['site-001', 'site-002', 'site-003'],
        delayRiskScores: {
          'site-001': 0.85,
          'site-002': 0.72,
          'site-003': 0.65,
        },
        detectionTimestamp: new Date('2024-01-15T10:30:00Z'),
        triggerSource: 'automated' as const,
      },
      executingUserId: 'user-center-001',
      collectionContextMetadata: {
        busyPeriodFlag: true,
        workInstructionChangeDetected: true,
        contextDescription: 'Busy period with work instruction changes detected',
      },
    };

    // Act
    const result = await orchestrateDataCollectionForDelayRisk(input);

    // Assert - Basic output structure
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.collectionOrchestrationId)).toBe(true);

    // Assert - Target sites are subset of affected sites
    expect(result.targetSiteIds).toBeDefined();
    expect(Array.isArray(result.targetSiteIds)).toBe(true);
    result.targetSiteIds.forEach(siteId => {
      expect(input.delayRiskDetectionResult.affectedSiteIds).toContain(siteId);
    });

    // Assert - Collection scope contains appropriate data items
    expect(result.collectionScope).toBeDefined();
    expect(Array.isArray(result.collectionScope)).toBe(true);
    expect(result.collectionScope.length).toBeGreaterThan(0);

    result.collectionScope.forEach(scope => {
      expect(scope.siteId).toBeDefined();
      expect(scope.dataItems).toBeDefined();
      expect(Array.isArray(scope.dataItems)).toBe(true);
      expect(scope.dataItems.length).toBeGreaterThan(0);
      scope.dataItems.forEach(item => {
        expect(['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance']).toContain(item);
      });
      expect(scope.frequency).toBeDefined();
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
      expect(typeof scope.priority).toBe('number');
      expect(scope.priority).toBeGreaterThanOrEqual(1);
    });

    // Assert - Busy period flag effects (higher priority, shorter frequency)
    const busyPeriodAffectedScopes = result.collectionScope.filter(scope =>
      input.delayRiskDetectionResult.affectedSiteIds.includes(scope.siteId)
    );
    
    if (input.collectionContextMetadata?.busyPeriodFlag === true) {
      const highFrequencyScopesExist = busyPeriodAffectedScopes.some(scope =>
        scope.frequency === 'realtime' || scope.frequency === 'every_5min'
      );
      expect(highFrequencyScopesExist).toBe(true);
    }

    // Assert - Work instruction change flag effects (high priority)
    if (input.collectionContextMetadata?.workInstructionChangeDetected === true) {
      const highPriorityScopesExist = busyPeriodAffectedScopes.some(scope =>
        scope.priority === 1 || scope.priority === 2
      );
      expect(highPriorityScopesExist).toBe(true);
    }

    // Assert - Combined flags should result in highest priority for affected sites
    const highestPrioritySite = result.collectionScope.reduce((max, current) =>
      current.priority < max.priority ? current : max
    );
    
    if (input.collectionContextMetadata?.busyPeriodFlag === true &&
        input.collectionContextMetadata?.workInstructionChangeDetected === true) {
      expect(highestPrioritySite.priority).toBeLessThanOrEqual(2);
      expect(['realtime', 'every_5min']).toContain(highestPrioritySite.frequency);
    }

    // Assert - Initiation status
    expect(result.collectionInitiationStatus).toBe('initiated');

    // Assert - Timestamps
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(
      result.orchestrationTimestamp.getTime()
    );

    // Assert - No failed sites when initiated successfully
    if (result.collectionInitiationStatus === 'initiated') {
      expect(result.failedSiteIds).toBeUndefined();
    }
  });
});