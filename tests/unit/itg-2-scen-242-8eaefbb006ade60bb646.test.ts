import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-242: orchestrateDataCollectionForDelayRisk - affectedSiteIds が空の場合のエラー処理', () => {
  it('影響を受ける拠点IDが空のとき、制約違反エラーが発生する', async () => {
    // Arrange
    const input = {
      delayRiskDetectionResult: {
        affectedSiteIds: [],
        delayRiskScores: {},
        detectionTimestamp: new Date(),
        triggerSource: 'automated' as const,
      },
      executingUserId: 'user_12345',
      collectionContextMetadata: undefined,
    };

    // Act & Assert
    await expect(orchestrateDataCollectionForDelayRisk(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'DelayRiskDetectionFailedError',
        message: expect.stringContaining('進捗遅延リスク検知データが不完全です'),
      })
    );
  });
});