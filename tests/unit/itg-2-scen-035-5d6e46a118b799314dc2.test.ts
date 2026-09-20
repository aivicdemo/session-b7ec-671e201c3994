import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as dataCollectionModule from '../../src/logic/data-collection-orchestration';
import * as dataRetrievalFallbackModule from '../../src/logic/data-retrieval-fallback';

describe('SCEN-035: WMS進捗データ取得タイムアウト・エラーで失敗時の処理', () => {
  it('WMSから進捗データ取得がタイムアウト・エラーで失敗し、キャッシュも存在しない場合、ProgressDataRetrievalFailureエラーが発生して配置案生成が中止される', async () => {
    // スタブ設定：認可検証成功
    jest.spyOn(authModule, 'authenticateUser').mockResolvedValue({
      userId: 'user-001',
      isAuthorized: true,
    });

    // スタブ設定：WMS進捗データ取得がエラーで失敗
    jest.spyOn(dataCollectionModule, 'orchestrateDataCollectionForDelayRisk').mockRejectedValue(
      new Error('WMS connection timeout'),
    );

    // スタブ設定：キャッシュが存在しない状態（null）
    jest.spyOn(dataRetrievalFallbackModule, 'handleDataRetrievalFailureAndGeneratePlacement').mockResolvedValue({
      cachedProgressData: null,
      placementProposal: null,
    });

    // テスト入力
    const input = {
      triggerType: 'realtime_monitoring' as const,
      targetSiteIds: undefined,
      delayRiskThreshold: 70,
      executingUserId: 'user-001',
      monitoringIntervalSeconds: 300,
      contextData: undefined,
    };

    // runTx4Imp1Agentを呼び出す
    const result = await runTx4Imp1Agent(input, {
      generateDelayRiskAnalysis: jest.fn(),
      identifyAffectedSites: jest.fn(),
      generatePlacementProposal: jest.fn(),
      generateDeliveryInstructions: jest.fn(),
    });

    // 検証：executionStatus が 'failure' であること
    expect(result.executionStatus).toBe('failure');

    // 検証：errorDetails が存在し、ProgressDataRetrievalFailureエラーが含まれること
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(Array.isArray(result.errorDetails)).toBe(true);

    const progressDataError = result.errorDetails?.find(
      (err) => err.name === 'ProgressDataRetrievalFailure',
    );
    expect(progressDataError).toBeDefined();

    // 検証：エラー名がProgressDataRetrievalFailureであること
    expect(progressDataError?.name).toBe('ProgressDataRetrievalFailure');

    // 検証：エラー文言が正確であること
    expect(progressDataError?.message).toBe(
      '進捗データ取得に失敗しました。キャッシュデータも利用不可のため、配置案生成を中止します。',
    );

    // 検証：detectedDelayRisks が空配列であること
    expect(Array.isArray(result.detectedDelayRisks)).toBe(true);
    expect(result.detectedDelayRisks).toHaveLength(0);

    // 検証：affectedSites が空配列であること
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites).toHaveLength(0);

    // 検証：placementProposals が空配列であること
    expect(Array.isArray(result.placementProposals)).toBe(true);
    expect(result.placementProposals).toHaveLength(0);

    // 検証：deliveryInstructions が空配列であること
    expect(Array.isArray(result.deliveryInstructions)).toBe(true);
    expect(result.deliveryInstructions).toHaveLength(0);

    // 検証：executionTimestamp が ISO 8601 形式の有効なタイムスタンプであること
    expect(typeof result.executionTimestamp).toBe('string');
    const timestampDate = new Date(result.executionTimestamp);
    expect(timestampDate.toString()).not.toBe('Invalid Date');
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );
  });
});