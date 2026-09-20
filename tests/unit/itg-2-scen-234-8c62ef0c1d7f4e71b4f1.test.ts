import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-234: 複数の拠点のリスクスコアが異なるとき、スコアが高い拠点ほど高い優先度で特定される', () => {
  it('should prioritize sites by descending risk scores', async () => {
    // Arrange
    const delayRiskDetectionResult = {
      affectedSiteIds: ['SITE-001', 'SITE-002', 'SITE-003', 'SITE-004', 'SITE-005'],
      delayRiskScores: {
        'SITE-001': 85,
        'SITE-002': 92,
        'SITE-003': 65,
        'SITE-004': 78,
        'SITE-005': 55,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    const executingUserId = 'USER-ADMIN-001';

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: 'Peak hour delay detected',
    };

    const now = new Date();

    // Act
    const result = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    });

    // Assert
    expect(result.collectionScope).toHaveLength(5);
    
    // Verify priority order matches risk scores (descending)
    expect(result.collectionScope[0].siteId).toBe('SITE-002');
    expect(result.collectionScope[0].priority).toBe(1);
    expect(delayRiskDetectionResult.delayRiskScores['SITE-002']).toBe(92);

    expect(result.collectionScope[1].siteId).toBe('SITE-001');
    expect(result.collectionScope[1].priority).toBe(2);
    expect(delayRiskDetectionResult.delayRiskScores['SITE-001']).toBe(85);

    expect(result.collectionScope[2].siteId).toBe('SITE-004');
    expect(result.collectionScope[2].priority).toBe(3);
    expect(delayRiskDetectionResult.delayRiskScores['SITE-004']).toBe(78);

    expect(result.collectionScope[3].siteId).toBe('SITE-003');
    expect(result.collectionScope[3].priority).toBe(4);
    expect(delayRiskDetectionResult.delayRiskScores['SITE-003']).toBe(65);

    expect(result.collectionScope[4].siteId).toBe('SITE-005');
    expect(result.collectionScope[4].priority).toBe(5);
    expect(delayRiskDetectionResult.delayRiskScores['SITE-005']).toBe(55);

    // Verify all target sites are included
    expect(result.targetSiteIds).toHaveLength(5);
    expect(result.targetSiteIds).toEqual(
      expect.arrayContaining(['SITE-001', 'SITE-002', 'SITE-003', 'SITE-004', 'SITE-005'])
    );

    // Verify collection initiation status
    expect(result.collectionInitiationStatus).toBe('initiated');
    expect(result.failedSiteIds).toEqual([]);

    // Verify IDs and timestamps
    expect(result.collectionOrchestrationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeGreaterThanOrEqual(now.getTime() + 5000);
    expect(result.estimatedDataAvailabilityTime.getTime()).toBeLessThanOrEqual(now.getTime() + 30000);
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
  });
});