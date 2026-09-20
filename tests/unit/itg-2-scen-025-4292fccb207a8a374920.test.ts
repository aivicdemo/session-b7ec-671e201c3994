import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-025: 進捗監視で遅延リスクスコアが閾値以下の場合は遅延リスク検知なしで配置案生成スキップ', () => {
  it('遅延リスクスコアが閾値以下の場合、配置案生成以降の処理がスキップされること', async () => {
    const input = {
      triggerType: 'scheduled_monitoring' as const,
      targetSiteIds: ['site001', 'site002'],
      delayRiskThreshold: 70,
      approverUserId: 'approver001',
      executingUserId: 'executor001',
    };

    const mockMonitorProgressAndDetectDelayRisk = jest.fn().mockResolvedValue({
      delayRiskDetected: false,
      delayRiskScore: 65,
      affectedSites: [],
    });

    const mockOrchestrateDataCollectionForDelayRisk = jest.fn();
    const mockJudgePersonnelReallocationFeasibility = jest.fn();
    const mockAssessDeliveryRiskAndProposeAdjustments = jest.fn();
    const mockBuildOptimalPlacementProposalScreen = jest.fn();
    const mockExecutePlacementChangeWithApproval = jest.fn();
    const mockSendProgressDelayRiskNotification = jest.fn();
    const mockDeliverPlacementInstructionToFieldLeader = jest.fn();

    const aiClient = {
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: mockOrchestrateDataCollectionForDelayRisk,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
      buildOptimalPlacementProposalScreen: mockBuildOptimalPlacementProposalScreen,
      executePlacementChangeWithApproval: mockExecutePlacementChangeWithApproval,
      sendProgressDelayRiskNotification: mockSendProgressDelayRiskNotification,
      deliverPlacementInstructionToFieldLeader: mockDeliverPlacementInstructionToFieldLeader,
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(mockMonitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(mockOrchestrateDataCollectionForDelayRisk).not.toHaveBeenCalled();
    expect(mockJudgePersonnelReallocationFeasibility).not.toHaveBeenCalled();
    expect(mockAssessDeliveryRiskAndProposeAdjustments).not.toHaveBeenCalled();
    expect(mockBuildOptimalPlacementProposalScreen).not.toHaveBeenCalled();
    expect(mockExecutePlacementChangeWithApproval).not.toHaveBeenCalled();
    expect(mockSendProgressDelayRiskNotification).not.toHaveBeenCalled();
    expect(mockDeliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();

    expect(result.executionStatus).toBe('delay_not_detected');
    expect(result.delayRiskDetected).toBe(false);
    expect(result.affectedSites).toBeUndefined();
    expect(result.placementProposalId).toBeUndefined();
    expect(result.placementProposalSummary).toBeUndefined();
    expect(result.expectedProductivityImprovement).toBeUndefined();
    expect(result.approvalStatus).toBeUndefined();
    expect(result.placementChangeHistoryId).toBeUndefined();
    expect(result.notificationsSent).toBeUndefined();
    expect(result.errorDetails).toBeUndefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});