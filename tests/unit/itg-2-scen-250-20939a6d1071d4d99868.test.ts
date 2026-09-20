import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-250: 自動トリガーと手動トリガーの双方のリスク検知に対応する', () => {
  it('delayRiskDetectionResult に triggerSource: automated を設定し、affectedSiteIds に複数拠点を指定する場合、対象拠点・対象データを特定して収集を開始する', async () => {
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

    const executingUserId = 'user-center-001';

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: '自動検知トリガーにより進捗遅延リスク検知',
    };

    // Act
    const result = await orchestrateDataCollectionForDelayRisk(
      {
        delayRiskDetectionResult,
        executingUserId,
        collectionContextMetadata,
      },
      {
        determineCollectionScope: jest.fn().mockResolvedValue({
          targetSiteIds: ['site-001', 'site-002'],
          scopeRationale: 'High risk scores detected',
        }),
        determineDataItemsAndFrequency: jest.fn().mockResolvedValue({
          dataItemsAndFrequencyBySite: [
            {
              siteId: 'site-001',
              dataItems: ['orders', 'inventory', 'outbound', 'workerPerformance'],
              frequency: 'every_5min',
            },
            {
              siteId: 'site-002',
              dataItems: ['orders', 'inventory', 'outbound', 'workerPerformance'],
              frequency: 'every_15min',
            },
          ],
        }),
        prioritizeCollectionTargets: jest.fn().mockResolvedValue({
          prioritizedCollectionScope: [
            {
              siteId: 'site-001',
              dataItems: ['orders', 'inventory', 'outbound', 'workerPerformance'],
              frequency: 'every_5min',
              priority: 1,
            },
            {
              siteId: 'site-002',
              dataItems: ['orders', 'inventory', 'outbound', 'workerPerformance'],
              frequency: 'every_15min',
              priority: 2,
            },
          ],
        }),
        synchronizeDataWithWESAndWMS: jest.fn().mockResolvedValue({
          collectionInitiationStatus: 'initiated',
          failedSiteIds: [],
        }),
      }
    );

    // Assert
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(result.collectionOrchestrationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    expect(result.targetSiteIds).toEqual(['site-001', 'site-002']);

    expect(result.collectionScope).toHaveLength(2);
    expect(result.collectionScope[0]).toEqual({
      siteId: 'site-001',
      dataItems: ['orders', 'inventory', 'outbound', 'workerPerformance'],
      frequency: 'every_5min',
      priority: 1,
    });
    expect(result.collectionScope[1]).toEqual({
      siteId: 'site-002',
      dataItems: ['orders', 'inventory', 'outbound', 'workerPerformance'],
      frequency: 'every_15min',
      priority: 2,
    });

    expect(result.collectionInitiationStatus).toBe('initiated');

    expect(result.failedSiteIds).toEqual([]);

    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    const timeDiffMinutes = (result.estimatedDataAvailabilityTime.getTime() - delayRiskDetectionResult.detectionTimestamp.getTime()) / (1000 * 60);
    expect(timeDiffMinutes).toBeGreaterThanOrEqual(0);
    expect(timeDiffMinutes).toBeLessThanOrEqual(5);

    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
    const orchestrationTimeDiff = Math.abs(result.orchestrationTimestamp.getTime() - new Date().getTime());
    expect(orchestrationTimeDiff).toBeLessThan(1000);
  });
});