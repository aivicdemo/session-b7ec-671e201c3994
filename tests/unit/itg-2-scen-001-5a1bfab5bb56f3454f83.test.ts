import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-001: 管理者が代表的な正常入力で実行すると、遅延リスクと品質ばらつきが検知され、配置案が生成・配信されて作業開始が記録される', () => {
  it('should complete agent execution with delay risk and quality variance detection', async () => {
    const adminUserId = 'admin-001';
    const siteIds = ['site-A', 'site-B'];
    const teamIds = ['team-1', 'team-2'];

    const input = {
      executingUserId: adminUserId,
      monitoringIntervalSeconds: 300,
      delayRiskThreshold: 70,
      qualityVarianceThreshold: 2.0,
      targetSiteIds: siteIds,
      targetTeamIds: teamIds,
    };

    const mockAiClient = {
      authorizeUserAction: jest.fn().mockResolvedValue({ authorized: true }),
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskDetected: true,
        delayRiskScore: 75,
        affectedSiteIds: siteIds,
      }),
      aggregatePerformanceDataByPeriod: jest.fn().mockResolvedValue({
        qualityVarianceDetected: true,
        standardDeviationMultiple: 2.5,
      }),
      assessDeliveryRiskAndProposeAdjustments: jest.fn().mockResolvedValue({
        placementProposalId: 'placement-proposal-001',
        proposedPlacements: [],
      }),
      deliverPlacementInstructionToFieldLeader: jest.fn().mockResolvedValue({
        deliveryStatus: 'delivered',
      }),
      recordWorkExecutionStart: jest.fn().mockResolvedValue({
        workExecutionRecordIds: ['work-exec-001', 'work-exec-002'],
      }),
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('completed');
    expect(result.delayRiskDetected).toBe(true);
    expect(result.qualityVarianceDetected).toBe(true);
    expect(result.affectedSiteIds).toEqual(siteIds);
    expect(result.placementProposalId).toBe('placement-proposal-001');
    expect(result.placementInstructionDeliveryStatus).toBe('delivered');
    expect(result.workExecutionRecordIds).toEqual(['work-exec-001', 'work-exec-002']);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.errorDetails).toBeNull();
  });
});