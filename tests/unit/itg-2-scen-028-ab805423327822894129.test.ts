import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-028: 承認者が配置案を却下した場合は承認却下で配置指示配信中止', () => {
  it('should set executionStatus to approval_rejected and not deliver placement instruction when approver rejects the proposal', async () => {
    const mockMonitorProgressAndDetectDelayRisk = jest.fn().mockResolvedValue({
      delayRiskDetected: true,
      affectedSites: [
        {
          siteId: 'site-001',
          riskScore: 85,
          affectedTeamIds: ['team-A', 'team-B'],
        },
      ],
    });

    const mockOrchestrateDataCollectionForDelayRisk = jest.fn().mockResolvedValue({
      dataCollectionCompleted: true,
    });

    const mockAssessDeliveryRiskAndProposeAdjustments = jest.fn().mockResolvedValue({
      placementProposalId: 'proposal-001',
      expectedProductivityImprovement: 15,
    });

    const mockBuildOptimalPlacementProposalScreen = jest.fn().mockResolvedValue({
      placementProposalSummary: {
        proposalId: 'proposal-001',
        recommendedTeams: ['team-A', 'team-B'],
        expectedImprovement: '15%',
      },
    });

    const mockAuthorizeUserAction = jest.fn().mockResolvedValue({
      hasApprovalAuthority: true,
    });

    const mockExecutePlacementChangeWithApproval = jest.fn().mockResolvedValue({
      approvalStatus: 'rejected',
    });

    const mockSendProgressDelayRiskNotification = jest.fn().mockResolvedValue({
      notificationsSent: [
        {
          recipientType: 'approver',
          recipientId: 'approver-user-001',
          notificationType: 'approval_rejection',
        },
        {
          recipientType: 'field_leader',
          recipientId: 'field-leader-001',
          notificationType: 'approval_rejection',
        },
      ],
    });

    const mockDeliverPlacementInstructionToFieldLeader = jest.fn();

    const aiClient: Tx3Imp1AiClient = {
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: mockOrchestrateDataCollectionForDelayRisk,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
      buildOptimalPlacementProposalScreen: mockBuildOptimalPlacementProposalScreen,
      authorizeUserAction: mockAuthorizeUserAction,
      executePlacementChangeWithApproval: mockExecutePlacementChangeWithApproval,
      sendProgressDelayRiskNotification: mockSendProgressDelayRiskNotification,
      deliverPlacementInstructionToFieldLeader: mockDeliverPlacementInstructionToFieldLeader,
    };

    const input = {
      triggerType: 'manual_trigger' as const,
      targetSiteIds: ['site-001'],
      delayRiskThreshold: 70,
      approverUserId: 'approver-user-001',
      approvalTimeoutMinutes: 30,
      executingUserId: 'exec-user-001',
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('approval_rejected');
    expect(result.delayRiskDetected).toBe(true);
    expect(result.affectedSites).toEqual([
      {
        siteId: 'site-001',
        riskScore: 85,
        affectedTeamIds: ['team-A', 'team-B'],
      },
    ]);
    expect(result.placementProposalId).toBe('proposal-001');
    expect(result.placementProposalSummary).toEqual({
      proposalId: 'proposal-001',
      recommendedTeams: ['team-A', 'team-B'],
      expectedImprovement: '15%',
    });
    expect(result.expectedProductivityImprovement).toBe(15);
    expect(result.approvalStatus).toBe('rejected');
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent?.length).toBeGreaterThan(0);
    expect(
      result.notificationsSent?.some(
        (n) =>
          n.recipientType === 'approver' &&
          n.recipientId === 'approver-user-001' &&
          n.notificationType === 'approval_rejection'
      )
    ).toBe(true);
    expect(
      result.notificationsSent?.some(
        (n) =>
          n.recipientType === 'field_leader' &&
          n.notificationType === 'approval_rejection'
      )
    ).toBe(true);
    expect(result.placementChangeHistoryId).toBeUndefined();
    expect(mockDeliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
    
    expect(mockMonitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(mockOrchestrateDataCollectionForDelayRisk).toHaveBeenCalled();
    expect(mockAssessDeliveryRiskAndProposeAdjustments).toHaveBeenCalled();
    expect(mockBuildOptimalPlacementProposalScreen).toHaveBeenCalled();
    expect(mockAuthorizeUserAction).toHaveBeenCalled();
    expect(mockExecutePlacementChangeWithApproval).toHaveBeenCalled();
    expect(mockSendProgressDelayRiskNotification).toHaveBeenCalled();
  });
});