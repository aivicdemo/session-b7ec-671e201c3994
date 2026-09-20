import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-003: 進捗データ監視の結果、遅延リスクスコアが検知閾値以下で配置案生成の対象外と判定されると、executionStatusが\'no_action_required\'で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no_action_required when delay risk score is below threshold', async () => {
    const input: Tx1Imp1AgentInput = {
      executingUserId: 'admin001',
      delayRiskThreshold: 70,
      monitoringIntervalSeconds: 300,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: undefined,
      targetTeamIds: undefined,
    };

    const aiClient = {
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskScore: 65,
        delayRiskDetected: false,
        affectedSiteIds: [],
      }),
      analyzeQualityVariance: jest.fn().mockResolvedValue({
        qualityVarianceDetected: false,
        affectedSiteIds: [],
      }),
      aggregatePerformanceDataByPeriod: jest.fn().mockResolvedValue({
        performanceData: [],
      }),
      judgePersonnelReallocationFeasibility: jest.fn().mockResolvedValue({
        feasible: false,
        reason: 'No delay risk detected',
      }),
      generatePlacementProposal: jest.fn().mockResolvedValue(null),
      deliverPlacementInstructions: jest.fn().mockResolvedValue({
        deliveryStatus: 'pending',
      }),
      monitorPlacementExecution: jest.fn().mockResolvedValue({
        workExecutionRecordIds: [],
      }),
    };

    const result = await runTx1Imp1Agent(input, aiClient as any);

    expect(aiClient.authorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'admin001' })
    );
    expect(aiClient.monitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(aiClient.analyzeQualityVariance).toHaveBeenCalled();
    expect(aiClient.aggregatePerformanceDataByPeriod).toHaveBeenCalled();
    expect(aiClient.judgePersonnelReallocationFeasibility).toHaveBeenCalled();

    expect(result.executionStatus).toBe('no_action_required');
    expect(result.delayRiskDetected).toBe(false);
    expect(result.qualityVarianceDetected).toBe(false);
    expect(result.affectedSiteIds).toEqual([]);
    expect(result.placementProposalId).toBeNull();
    expect(result.placementInstructionDeliveryStatus).toBe('pending');
    expect(result.workExecutionRecordIds).toEqual([]);
    expect(result.errorDetails).toBeNull();
    expect(result.executionTimestamp).toBeDefined();
  });
});