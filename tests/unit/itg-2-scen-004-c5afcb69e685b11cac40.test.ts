import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-004: 品質ばらつき検知の結果、異常値が検知閾値以下で配置案生成の対象外と判定される場合', () => {
  it('executionStatusが no_action_required で返される', async () => {
    const input = {
      executingUserId: 'admin-user-001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: undefined,
      targetTeamIds: undefined,
    };

    // モック用の Tx1Imp1AiClient インターフェース実装
    const aiClient = {
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskDetected: false,
        delayRiskScore: 65, // 閾値70以下
        affectedSiteIds: [],
      }),
      aggregatePerformanceDataByPeriod: jest.fn().mockResolvedValue({
        performanceData: [
          { workerId: 'worker-1', productivity: 100, qualityScore: 95 },
          { workerId: 'worker-2', productivity: 102, qualityScore: 94 },
          { workerId: 'worker-3', productivity: 98, qualityScore: 96 },
        ],
      }),
      detectQualityVariance: jest.fn().mockResolvedValue({
        qualityVarianceDetected: false,
        standardDeviationMultiple: 1.5, // 閾値2.0以下
        qualityVarianceMetrics: {},
      }),
    };

    const result = await runTx1Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('no_action_required');
    expect(result.delayRiskDetected).toBe(false);
    expect(result.qualityVarianceDetected).toBe(false);
    expect(result.affectedSiteIds).toEqual([]);
    expect(result.placementProposalId).toBeNull();
    expect(result.placementInstructionDeliveryStatus).toBe('pending');
    expect(result.workExecutionRecordIds).toEqual([]);
    expect(result.errorDetails).toBeNull();

    // executionTimestamp が ISO 8601 形式であることを確認
    expect(result.executionTimestamp).toBeTruthy();
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.toString()).not.toBe('Invalid Date');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // モック関数の呼び出しを検証
    expect(aiClient.authorizeUserAction).toHaveBeenCalledWith(input.executingUserId);
    expect(aiClient.monitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(aiClient.aggregatePerformanceDataByPeriod).toHaveBeenCalled();
    expect(aiClient.detectQualityVariance).toHaveBeenCalled();
  });
});