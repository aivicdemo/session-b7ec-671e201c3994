import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-023: 進捗遅延リスク検知から配置指示配信までの自動実行', () => {
  let monitorProgressAndDetectDelayRiskStub: jest.Mock;
  let orchestrateDataCollectionForDelayRiskStub: jest.Mock;
  let judgePersonnelReallocationFeasibilityStub: jest.Mock;
  let assessDeliveryRiskAndProposeAdjustmentsStub: jest.Mock;
  let buildOptimalPlacementProposalScreenStub: jest.Mock;
  let authorizeUserActionStub: jest.Mock;
  let executePlacementChangeWithApprovalStub: jest.Mock;
  let sendProgressDelayRiskNotificationStub: jest.Mock;
  let deliverPlacementInstructionToFieldLeaderStub: jest.Mock;

  beforeEach(() => {
    monitorProgressAndDetectDelayRiskStub = jest.fn();
    orchestrateDataCollectionForDelayRiskStub = jest.fn();
    judgePersonnelReallocationFeasibilityStub = jest.fn();
    assessDeliveryRiskAndProposeAdjustmentsStub = jest.fn();
    buildOptimalPlacementProposalScreenStub = jest.fn();
    authorizeUserActionStub = jest.fn();
    executePlacementChangeWithApprovalStub = jest.fn();
    sendProgressDelayRiskNotificationStub = jest.fn();
    deliverPlacementInstructionToFieldLeaderStub = jest.fn();
  });

  it('定刻監視トリガーで全拠点対象かつ遅延リスク検知され、承認者に承認されて現場リーダーに配置指示が配信される', async () => {
    const affectedSites = [
      { siteId: 'site-001', riskScore: 75, affectedTeamIds: ['team-001', 'team-002'] },
      { siteId: 'site-002', riskScore: 80, affectedTeamIds: ['team-003'] },
    ];

    monitorProgressAndDetectDelayRiskStub.mockResolvedValue({
      delayRiskDetected: true,
      affectedSites,
    });

    const collectedData = {
      currentProgress: [
        { siteId: 'site-001', progress: 45 },
        { siteId: 'site-002', progress: 40 },
      ],
      productivityData: [
        { teamId: 'team-001', productivity: 85 },
        { teamId: 'team-003', productivity: 78 },
      ],
    };

    orchestrateDataCollectionForDelayRiskStub.mockResolvedValue(collectedData);

    judgePersonnelReallocationFeasibilityStub.mockResolvedValue({
      feasible: true,
      availablePersonnel: 15,
    });

    const placementProposalData = {
      placementProposalId: 'prop-001',
      expectedProductivityImprovement: 15,
      proposedChanges: [
        { fromTeamId: 'team-004', toTeamId: 'team-001', workerCount: 3 },
        { fromTeamId: 'team-005', toTeamId: 'team-003', workerCount: 2 },
      ],
    };

    assessDeliveryRiskAndProposeAdjustmentsStub.mockResolvedValue(placementProposalData);

    const placementProposalSummary = {
      proposalId: 'prop-001',
      affectedTeams: ['team-001', 'team-003', 'team-004', 'team-005'],
      estimatedCompletionDate: '2024-01-15T18:00:00Z',
      expectedProductivityGain: 15,
      riskMitigation: 'High',
    };

    buildOptimalPlacementProposalScreenStub.mockResolvedValue(placementProposalSummary);

    authorizeUserActionStub.mockResolvedValue({
      authorized: true,
      userId: 'approver-001',
    });

    executePlacementChangeWithApprovalStub.mockResolvedValue({
      approvalStatus: 'approved',
      placementChangeHistoryId: 'hist-001',
      executedAt: '2024-01-15T10:30:00Z',
    });

    sendProgressDelayRiskNotificationStub.mockResolvedValue({
      recipientType: 'admin',
      recipientId: 'admin-001',
      notificationType: 'delay_risk_alert',
    });

    const fieldLeaderNotification = {
      recipientType: 'field_leader',
      recipientId: 'leader-001',
      notificationType: 'placement_instruction',
    };

    deliverPlacementInstructionToFieldLeaderStub.mockResolvedValue(fieldLeaderNotification);

    const aiClient = {
      monitorProgressAndDetectDelayRisk: monitorProgressAndDetectDelayRiskStub,
      orchestrateDataCollectionForDelayRisk: orchestrateDataCollectionForDelayRiskStub,
      judgePersonnelReallocationFeasibility: judgePersonnelReallocationFeasibilityStub,
      assessDeliveryRiskAndProposeAdjustments: assessDeliveryRiskAndProposeAdjustmentsStub,
      buildOptimalPlacementProposalScreen: buildOptimalPlacementProposalScreenStub,
      authorizeUserAction: authorizeUserActionStub,
      executePlacementChangeWithApproval: executePlacementChangeWithApprovalStub,
      sendProgressDelayRiskNotification: sendProgressDelayRiskNotificationStub,
      deliverPlacementInstructionToFieldLeader: deliverPlacementInstructionToFieldLeaderStub,
    };

    const input = {
      triggerType: 'scheduled_monitoring',
      targetSiteIds: undefined,
      delayRiskThreshold: 70,
      approverUserId: 'approver-001',
      approvalTimeoutMinutes: 30,
      executingUserId: 'executor-001',
    };

    const result = await runTx3Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('completed');
    expect(result.delayRiskDetected).toBe(true);
    expect(result.affectedSites).toHaveLength(2);
    expect(result.affectedSites[0]).toMatchObject({
      siteId: 'site-001',
      riskScore: 75,
      affectedTeamIds: expect.arrayContaining(['team-001', 'team-002']),
    });
    expect(result.affectedSites[1]).toMatchObject({
      siteId: 'site-002',
      riskScore: 80,
      affectedTeamIds: expect.arrayContaining(['team-003']),
    });

    expect(result.placementProposalId).toBe('prop-001');
    expect(result.placementProposalSummary).toMatchObject(placementProposalSummary);
    expect(result.expectedProductivityImprovement).toBe(15);
    expect(result.approvalStatus).toBe('approved');
    expect(result.placementChangeHistoryId).toBe('hist-001');

    expect(result.notificationsSent).toContainEqual(
      expect.objectContaining({
        recipientType: 'admin',
        notificationType: 'delay_risk_alert',
      })
    );

    expect(result.notificationsSent).toContainEqual(
      expect.objectContaining({
        recipientType: 'field_leader',
        notificationType: 'placement_instruction',
      })
    );

    expect(result.errorDetails).toBeUndefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    expect(monitorProgressAndDetectDelayRiskStub).toHaveBeenCalledWith(
      expect.objectContaining({
        targetSiteIds: undefined,
        delayRiskThreshold: 70,
      })
    );

    expect(orchestrateDataCollectionForDelayRiskStub).toHaveBeenCalledWith(
      expect.any(Object)
    );

    expect(judgePersonnelReallocationFeasibilityStub).toHaveBeenCalledWith(
      expect.any(Object)
    );

    expect(assessDeliveryRiskAndProposeAdjustmentsStub).toHaveBeenCalledWith(
      expect.any(Object)
    );

    expect(buildOptimalPlacementProposalScreenStub).toHaveBeenCalledWith(
      expect.objectContaining({
        placementProposalId: 'prop-001',
      })
    );

    expect(authorizeUserActionStub).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'approver-001',
      })
    );

    expect(executePlacementChangeWithApprovalStub).toHaveBeenCalledWith(
      expect.any(Object)
    );

    expect(sendProgressDelayRiskNotificationStub).toHaveBeenCalledWith(
      expect.any(Object)
    );

    expect(deliverPlacementInstructionToFieldLeaderStub).toHaveBeenCalledWith(
      expect.any(Object)
    );
  });
});