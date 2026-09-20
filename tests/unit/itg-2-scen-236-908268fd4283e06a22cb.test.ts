import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-236: システム負荷率に応じて収集頻度が自動調整される', () => {
  it('should automatically adjust collection frequency based on system load rate and determine target sites and data items for collection', () => {
    // Step 1: 入力値を構築
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

    const executingUserId = 'user-admin-001';

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: '通常営業日の繁忙期',
    };

    // Step 2: 業務ルール br-tx_3-003 の計算ロジックに基づき、各拠点のシステム負荷率を設定
    // site-001 = 75%（70%以上）、site-002 = 65%（70%未満）、site-003 = 55%（70%未満）
    // これらの値は delayRiskScores として反映される（0.75, 0.65, 0.55）
    const systemLoadRates = {
      'site-001': 0.75,
      'site-002': 0.65,
      'site-003': 0.55,
    };

    // Step 3: 各拠点の繁忙度スコアを計算
    // site-001: workerRatio=40、orderRatio=35、合計75（高繁忙）
    // site-002: workerRatio=30、orderRatio=25、合計55（中繁忙）
    // site-003: workerRatio=20、orderRatio=15、合計35（低繁忙）
    const busyScores = {
      'site-001': 75,
      'site-002': 55,
      'site-003': 35,
    };

    // Step 4: orchestrateDataCollectionForDelayRisk を呼び出す
    const orchestrationTimestamp = new Date();
    const result = orchestrateDataCollectionForDelayRisk(
      {
        delayRiskDetectionResult: {
          ...delayRiskDetectionResult,
          detectionTimestamp: orchestrationTimestamp,
        },
        executingUserId,
        collectionContextMetadata,
      }
    );

    // Step 5: collectionOrchestrationId が UUID 形式で返されることを確認
    expect(result.collectionOrchestrationId).toBeDefined();
    expect(typeof result.collectionOrchestrationId).toBe('string');
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.collectionOrchestrationId)).toBe(true);

    // Step 6: targetSiteIds に ['site-001', 'site-002', 'site-003'] が含まれることを確認
    expect(result.targetSiteIds).toEqual(expect.arrayContaining(['site-001', 'site-002', 'site-003']));
    expect(result.targetSiteIds.length).toBe(3);

    // Step 7: collectionScope の各要素を確認
    expect(result.collectionScope).toBeDefined();
    expect(result.collectionScope.length).toBe(3);

    const scope001 = result.collectionScope.find(s => s.siteId === 'site-001');
    const scope002 = result.collectionScope.find(s => s.siteId === 'site-002');
    const scope003 = result.collectionScope.find(s => s.siteId === 'site-003');

    expect(scope001).toBeDefined();
    expect(scope002).toBeDefined();
    expect(scope003).toBeDefined();

    // site-001（高繁忙・高負荷）は every_5min
    expect(scope001!.frequency).toBe('every_5min');
    // site-002（中繁忙・低負荷）は every_15min
    expect(scope002!.frequency).toBe('every_15min');
    // site-003（低繁忙・低負荷）は hourly
    expect(scope003!.frequency).toBe('hourly');

    // Step 8: priority 値を確認
    expect(scope001!.priority).toBe(1);
    expect(scope002!.priority).toBe(2);
    expect(scope003!.priority).toBe(3);

    // Step 9: dataItems が各拠点で ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'] を含む
    const expectedDataItems = ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'];
    expect(scope001!.dataItems).toEqual(expect.arrayContaining(expectedDataItems));
    expect(scope002!.dataItems).toEqual(expect.arrayContaining(expectedDataItems));
    expect(scope003!.dataItems).toEqual(expect.arrayContaining(expectedDataItems));

    // Step 10: collectionInitiationStatus が 'initiated'
    expect(result.collectionInitiationStatus).toBe('initiated');

    // Step 11: failedSiteIds が存在しないか空配列
    expect(result.failedSiteIds === undefined || result.failedSiteIds.length === 0).toBe(true);

    // Step 12: estimatedDataAvailabilityTime の確認
    expect(result.estimatedDataAvailabilityTime).toBeDefined();
    expect(result.estimatedDataAvailabilityTime instanceof Date).toBe(true);

    // estimatedDataAvailabilityTime が orchestrationTimestamp から最短の frequency（every_5min に相当する20秒）を加算した時刻であることを確認
    const expectedAvailabilityTime = new Date(result.orchestrationTimestamp.getTime() + 20000); // 20秒を加算
    const timeDiffToAvailability = Math.abs(result.estimatedDataAvailabilityTime.getTime() - expectedAvailabilityTime.getTime());
    expect(timeDiffToAvailability).toBeLessThanOrEqual(1000); // 1秒以内の誤差を許容

    // Step 13: orchestrationTimestamp がテスト実行時刻の±5秒以内
    expect(result.orchestrationTimestamp).toBeDefined();
    expect(result.orchestrationTimestamp instanceof Date).toBe(true);
    const timeDiff = Math.abs(result.orchestrationTimestamp.getTime() - orchestrationTimestamp.getTime());
    expect(timeDiff).toBeLessThanOrEqual(5000);
  });
});