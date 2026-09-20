import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-013: 品質ばらつき検知の閾値がデフォルト値で適用される', () => {
  test('品質ばらつき検知閾値がデフォルト値2.0で適用され、ばらつきが許容範囲内の場合は配置案が生成されない', async () => {
    // 入力型を構成: qualityVarianceThresholdをundefinedとしてデフォルト値を使用
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin001',
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: undefined,
      targetSiteIds: undefined,
      targetTeamIds: undefined
    };

    // AI client interface (Tx1Imp1AiClient構造)を構成
    const aiClient = {
      authorizeUser: jest.fn().mockResolvedValue({ authorized: true }),
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskScore: 65,
        monitoredSiteIds: ['site-001', 'site-002']
      }),
      aggregatePerformanceDataByPeriod: jest.fn().mockResolvedValue({
        'site-001': {
          qualityScores: [80, 85, 78, 92, 88],
          mean: 84.6,
          standardDeviation: 5.3
        },
        'site-002': {
          qualityScores: [75, 70, 76, 73, 74],
          mean: 73.6,
          standardDeviation: 1.9
        }
      })
    };

    // runTx1Imp1Agent を呼び出し、第2引数にai clientを渡す
    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    // 期待結果を検証
    expect(output.executionStatus).toBe('no_action_required');
    expect(output.delayRiskDetected).toBe(false);
    expect(output.qualityVarianceDetected).toBe(false);
    expect(output.affectedSiteIds).toEqual([]);
    expect(output.placementProposalId).toBeNull();
    expect(output.placementInstructionDeliveryStatus).toBe('pending');
    expect(output.workExecutionRecordIds).toEqual([]);
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(output.errorDetails).toBeNull();
  });
});