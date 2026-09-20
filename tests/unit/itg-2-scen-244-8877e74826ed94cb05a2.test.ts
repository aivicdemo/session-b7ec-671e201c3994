import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-244: Data collection orchestration with 25 affected sites', () => {
  it('should narrow down to top 20 sites by busyness score when affected sites exceed 20', async () => {
    // Setup: Create 25 site IDs with different busyness scores
    const affectedSiteIds = Array.from({ length: 25 }, (_, i) => `site-${String(i + 1).padStart(3, '0')}`);
    
    // Busyness scores: 95, 92, 88, 85, 82, 79, 76, 73, 70, 67, 64, 61, 58, 55, 52, 49, 46, 43, 40, 37, 34, 31, 28, 25, 22
    const busynessScores = [95, 92, 88, 85, 82, 79, 76, 73, 70, 67, 64, 61, 58, 55, 52, 49, 46, 43, 40, 37, 34, 31, 28, 25, 22];
    
    // Create delayRiskScores mapping for the orchestration function
    const delayRiskScores: Record<string, number> = {};
    affectedSiteIds.forEach((siteId, index) => {
      delayRiskScores[siteId] = busynessScores[index];
    });

    const delayRiskDetectionResult = {
      affectedSiteIds: affectedSiteIds,
      delayRiskScores: delayRiskScores,
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    const executingUserId = 'user-center-manager-001';
    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: 'Progress delay detected',
    };

    // Execute
    const result = await orchestrateDataCollectionForDelayRisk(
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata
    );

    // Verify targetSiteIds contains only top 20 sites by busyness score
    expect(result.targetSiteIds).toHaveLength(20);
    
    // Top 20 sites should be site-001 through site-020 (scores 95 to 40)
    const expectedTopSites = Array.from({ length: 20 }, (_, i) => `site-${String(i + 1).padStart(3, '0')}`);
    expect(result.targetSiteIds).toEqual(expectedTopSites);
    
    // Verify sites 21-25 are excluded
    expect(result.targetSiteIds).not.toContain('site-021');
    expect(result.targetSiteIds).not.toContain('site-022');
    expect(result.targetSiteIds).not.toContain('site-023');
    expect(result.targetSiteIds).not.toContain('site-024');
    expect(result.targetSiteIds).not.toContain('site-025');

    // Verify collectionScope contains exactly 20 scopes
    expect(result.collectionScope).toHaveLength(20);
    
    // Verify each scope corresponds to a target site
    result.collectionScope.forEach((scope, index) => {
      expect(scope.siteId).toBe(expectedTopSites[index]);
    });

    // Verify priority assignment: highest busyness score gets priority 1
    const scopesByPriority = [...result.collectionScope].sort((a, b) => a.priority - b.priority);
    
    // Priority 1 should be site-001 (busyness score 95)
    expect(scopesByPriority[0].siteId).toBe('site-001');
    expect(scopesByPriority[0].priority).toBe(1);
    
    // Priority 20 should be site-020 (busyness score 40)
    expect(scopesByPriority[19].siteId).toBe('site-020');
    expect(scopesByPriority[19].priority).toBe(20);
    
    // Verify priorities are sequential 1-20
    scopesByPriority.forEach((scope, index) => {
      expect(scope.priority).toBe(index + 1);
    });

    // Verify collectionInitiationStatus is 'initiated'
    expect(result.collectionInitiationStatus).toBe('initiated');

    // Verify each scope has valid data items and frequency
    result.collectionScope.forEach((scope) => {
      expect(scope.dataItems).toBeDefined();
      expect(scope.dataItems.length).toBeGreaterThan(0);
      expect(['realtime', 'every_5min', 'every_15min', 'hourly']).toContain(scope.frequency);
    });

    // Verify estimatedDataAvailabilityTime is set
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    
    // Verify orchestrationTimestamp is set
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);

    // Verify collectionOrchestrationId is a valid identifier
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(typeof result.collectionOrchestrationId).toBe('string');
    expect(result.collectionOrchestrationId.length).toBeGreaterThan(0);
  });
});