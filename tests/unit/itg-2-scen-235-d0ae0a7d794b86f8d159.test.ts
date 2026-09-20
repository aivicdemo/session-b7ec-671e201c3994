import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-235: 繁忙度が高い順に最大20拠点まで収集対象として選定される', () => {
  it('should select top 20 sites by busyness score and assign priorities correctly', async () => {
    // Step 1: 進捗遅延リスク検知結果を準備する
    const affectedSiteIds = Array.from({ length: 30 }, (_, i) => `site-${String(i + 1).padStart(3, '0')}');
    
    // 業務ルール br-tx_3-003 に基づいて繁忙度スコアを計算
    // workerCountByShift と orderBacklogByPriority から計算される繁忙度スコア
    const delayRiskScores: Record<string, number> = {};
    const busynessData: Array<{ siteId: string; score: number }> = [];
    
    affectedSiteIds.forEach((siteId, index) => {
      // 繁忙度スコアを 100 から 13 まで段階的に低下させる
      const score = 100 - (index * 3);
      delayRiskScores[siteId] = score;
      busynessData.push({ siteId, score });
    });

    const detectionTimestamp = new Date();
    
    const delayRiskDetectionResult = {
      affectedSiteIds,
      delayRiskScores,
      detectionTimestamp,
      triggerSource: 'automated' as const,
    };

    // Step 2: collectionContextMetadata を準備する
    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: '繁忙期における進捗遅延リスク検知に基づくデータ収集',
    };

    // Step 3: executingUserId を設定する
    const executingUserId = 'logistics-center-manager-001';

    // 繁忙度スコアが高い順に上位20拠点を抽出
    const top20ByBusyness = busynessData
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.siteId);

    // Step 4-6: orchestrateDataCollectionForDelayRisk を呼び出す
    const output = await orchestrateDataCollectionForDelayRisk(
      {
        delayRiskDetectionResult,
        executingUserId,
        collectionContextMetadata,
      },
      {
        determineCollectionScope: jest.fn().mockResolvedValue({
          targetSiteIds: top20ByBusyness,
          scopeRationale: 'Top 20 sites by busyness score selected for data collection',
        }),
        determineDataItemsAndFrequency: jest.fn().mockResolvedValue({
          dataItemsAndFrequencyBySite: top20ByBusyness.map((siteId) => {
            const score = delayRiskScores[siteId];
            // 繁忙度に応じて複数の頻度オプションを提供
            let frequency: 'realtime' | 'every_5min' | 'every_15min' | 'hourly';
            if (score >= 70) {
              frequency = Math.random() < 0.5 ? 'realtime' : 'every_5min';
            } else if (score >= 40) {
              frequency = Math.random() < 0.5 ? 'every_15min' : 'hourly';
            } else {
              frequency = 'hourly';
            }
            return {
              siteId,
              dataItems: ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'],
              frequency,
            };
          }),
        }),
        prioritizeCollectionTargets: jest.fn().mockResolvedValue({
          prioritizedCollectionScope: top20ByBusyness.map((siteId, index) => {
            const score = delayRiskScores[siteId];
            // 繁忙度に応じて複数の頻度オプションを提供
            let frequency: 'realtime' | 'every_5min' | 'every_15min' | 'hourly';
            if (score >= 70) {
              frequency = Math.random() < 0.5 ? 'realtime' : 'every_5min';
            } else if (score >= 40) {
              frequency = Math.random() < 0.5 ? 'every_15min' : 'hourly';
            } else {
              frequency = 'hourly';
            }
            return {
              siteId,
              dataItems: ['orders', 'inventory', 'inbound', 'outbound', 'workerPerformance'],
              frequency,
              priority: index + 1,
            };
          }),
        }),
        synchronizeDataWithWESAndWMS: jest.fn().mockResolvedValue({
          collectionInitiationStatus: 'initiated',
          failedSiteIds: [],
        }),
      }
    );

    // Step 7: targetSiteIds が正確に20拠点に絞り込まれていることを確認する
    expect(output.targetSiteIds).toHaveLength(20);
    expect(output.targetSiteIds).toEqual(top20ByBusyness);

    // Step 8: priority フィールドが 1～20 で連続かつ重複なく割り当てられていることを確認する
    const priorities = output.collectionScope.map((scope) => scope.priority).sort((a, b) => a - b);
    expect(priorities).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(new Set(priorities).size).toBe(20);

    // Step 9: 繁忙度スコアが 70 以上の拠点の frequency が realtime または every_5min のいずれかであることを確認する
    output.collectionScope.forEach((scope) => {
      if (delayRiskScores[scope.siteId] >= 70) {
        expect(['realtime', 'every_5min']).toContain(scope.frequency);
      }
    });

    // Step 10: 繁忙度スコアが 40～69 の拠点の frequency が every_15min または hourly のいずれかであることを確認する
    output.collectionScope.forEach((scope) => {
      if (delayRiskScores[scope.siteId] >= 40 && delayRiskScores[scope.siteId] < 70) {
        expect(['every_15min', 'hourly']).toContain(scope.frequency);
      }
    });

    // Step 11: collectionInitiationStatus が 'initiated' であることを確認する
    expect(output.collectionInitiationStatus).toBe('initiated');

    // Step 12: failedSiteIds が空配列であることを確認する
    expect(output.failedSiteIds).toEqual([]);
  });
});