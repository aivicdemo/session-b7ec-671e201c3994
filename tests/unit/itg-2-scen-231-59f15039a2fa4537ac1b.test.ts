import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-231: 進捗遅延リスク検知時のデータ収集オーケストレーション - エラーケース', () => {
  describe('入力データが不完全または無効な場合', () => {
    test('affectedSiteIds が空配列の場合、DelayRiskDetectionFailedError を発生させる', async () => {
      const incompleteInput = {
        delayRiskDetectionResult: {
          affectedSiteIds: [],
          delayRiskScores: { 'site-001': 75 },
          detectionTimestamp: new Date(),
          triggerSource: 'manual' as const,
        },
        executingUserId: 'user-valid-id',
        collectionContextMetadata: null,
      };

      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow('DelayRiskDetectionFailedError');
      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow(
        '進捗遅延リスク検知データが不完全です。必須項目を確認してください。'
      );
    });

    test('delayRiskScores が null の場合、DelayRiskDetectionFailedError を発生させる', async () => {
      const incompleteInput = {
        delayRiskDetectionResult: {
          affectedSiteIds: ['site-001', 'site-002'],
          delayRiskScores: null as any,
          detectionTimestamp: new Date(),
          triggerSource: 'manual' as const,
        },
        executingUserId: 'user-valid-id',
        collectionContextMetadata: null,
      };

      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow('DelayRiskDetectionFailedError');
      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow(
        '進捗遅延リスク検知データが不完全です。必須項目を確認してください。'
      );
    });

    test('detectionTimestamp が undefined の場合、DelayRiskDetectionFailedError を発生させる', async () => {
      const incompleteInput = {
        delayRiskDetectionResult: {
          affectedSiteIds: ['site-001'],
          delayRiskScores: { 'site-001': 65 },
          detectionTimestamp: undefined as any,
          triggerSource: 'manual' as const,
        },
        executingUserId: 'user-valid-id',
        collectionContextMetadata: null,
      };

      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow('DelayRiskDetectionFailedError');
      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow(
        '進捗遅延リスク検知データが不完全です。必須項目を確認してください。'
      );
    });

    test('delayRiskDetectionResult が null の場合、DelayRiskDetectionFailedError を発生させる', async () => {
      const incompleteInput = {
        delayRiskDetectionResult: null as any,
        executingUserId: 'user-valid-id',
        collectionContextMetadata: null,
      };

      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow('DelayRiskDetectionFailedError');
      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow(
        '進捗遅延リスク検知データが不完全です。必須項目を確認してください。'
      );
    });

    test('executingUserId が空文字列の場合、DelayRiskDetectionFailedError を発生させる', async () => {
      const incompleteInput = {
        delayRiskDetectionResult: {
          affectedSiteIds: ['site-001'],
          delayRiskScores: { 'site-001': 55 },
          detectionTimestamp: new Date(),
          triggerSource: 'manual' as const,
        },
        executingUserId: '',
        collectionContextMetadata: null,
      };

      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow('DelayRiskDetectionFailedError');
      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow(
        '進捗遅延リスク検知データが不完全です。必須項目を確認してください。'
      );
    });

    test('複数の必須フィールドが不完全な場合、DelayRiskDetectionFailedError を発生させる', async () => {
      const incompleteInput = {
        delayRiskDetectionResult: {
          affectedSiteIds: [],
          delayRiskScores: null as any,
          detectionTimestamp: undefined as any,
          triggerSource: 'manual' as const,
        },
        executingUserId: '',
        collectionContextMetadata: null,
      };

      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow('DelayRiskDetectionFailedError');
      await expect(orchestrateDataCollectionForDelayRisk(incompleteInput)).rejects.toThrow(
        '進捗遅延リスク検知データが不完全です。必須項目を確認してください。'
      );
    });
  });
});