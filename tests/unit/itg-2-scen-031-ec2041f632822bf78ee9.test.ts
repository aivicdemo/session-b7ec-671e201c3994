import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as orchestratorModule from '../../src/agents/tx-3-imp-1/orchestrator';

jest.mock('../../src/agents/tx-3-imp-1/orchestrator', () => ({
  ...jest.requireActual('../../src/agents/tx-3-imp-1/orchestrator'),
  monitorProgressAndDetectDelayRisk: jest.fn(),
  orchestrateDataCollectionForDelayRisk: jest.fn(),
  judgePersonnelReallocationFeasibility: jest.fn(),
  assessDeliveryRiskAndProposeAdjustments: jest.fn(),
  buildOptimalPlacementProposalScreen: jest.fn(),
  authorizeUserAction: jest.fn(),
  executePlacementChangeWithApproval: jest.fn(),
  sendProgressDelayRiskNotification: jest.fn(),
  deliverPlacementInstructionToFieldLeader: jest.fn(),
}));

describe('SCEN-031: 手動トリガーで指定拠点のみを対象として実行される', () => {
  const mockAiClient = {
    monitorProgressAndDetectDelayRisk: jest.fn(),
    orchestrateDataCollectionForDelayRisk: jest.fn(),
    judgePersonnelReallocationFeasibility: jest.fn(),
    assessDeliveryRiskAndProposeAdjustments: jest.fn(),
    buildOptimalPlacementProposalScreen: jest.fn(),
    authorizeUserAction: jest.fn(),
    executePlacementChangeWithApproval: jest.fn(),
    sendProgressDelayRiskNotification: jest.fn(),
    deliverPlacementInstructionToFieldLeader: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient.monitorProgressAndDetectDelayRisk.mockResolvedValue({
      delayRiskDetected: true,
      affectedSites: [
        { siteId: 'site-001', riskScore: 75, affectedTeamIds: ['team-001'] },
        { siteId: 'site-002', riskScore: 72, affectedTeamIds: ['team-002'] },
        { siteId: 'site-003', riskScore: 68, affectedTeamIds: ['team-003'] },
      ],
    });

    mockAiClient.orchestrateDataCollectionForDelayRisk.mockResolvedValue({
      success: true,
      targetSites: ['site-001', 'site-002', 'site-003'],
      progressData: {
        'site-001': { completionRate: 60, plannedRate: 80 },
        'site-002': { completionRate: 55, plannedRate: 75 },
        'site-003': { completionRate: 65, plannedRate: 78 },
      },
    });

    mockAiClient.judgePersonnelReallocationFeasibility.mockResolvedValue({
      feasible: true,
      availablePersonnel: 15,
    });

    mockAiClient.assessDeliveryRiskAndProposeAdjustments.mockResolvedValue({
      placementProposalId: 'proposal-001',
      expectedProductivityImprovement: 12,
      placementProposalSummary: {
        proposalName: '人員配置案1',
        affectedSites: ['site-001', 'site-002', 'site-003'],
        expectedCompletionDate: '2024-12-31T23:59:59Z',
      },
    });

    mockAiClient.buildOptimalPlacementProposalScreen.mockResolvedValue({
      placementProposalSummary: {
        proposalName: '人員配置案1',
        affectedSites: ['site-001', 'site-002', 'site-003'],
        expectedCompletionDate: '2024-12-31T23:59:59Z',
      },
    });

    mockAiClient.authorizeUserAction.mockResolvedValue({
      authorized: true,
      userId: 'approver-user-1',
      permissions: ['approve_placement'],
    });

    mockAiClient.executePlacementChangeWithApproval.mockResolvedValue({
      approved: true,
      placementChangeHistoryId: 'history-001',
      executedAt: new Date().toISOString(),
    });

    mockAiClient.sendProgressDelayRiskNotification.mockResolvedValue({
      success: true,
      notificationsSent: [
        {
          recipientType: 'manager',
          recipientId: 'manager-001',
          notificationType: 'delay_risk_alert',
        },
      ],
    });

    mockAiClient.deliverPlacementInstructionToFieldLeader.mockResolvedValue({
      success: true,
      deliveredTo: [
        {
          recipientType: 'field_leader',
          recipientId: 'leader-site-001',
          notificationType: 'placement_instruction',
        },
        {
          recipientType: 'field_leader',
          recipientId: 'leader-site-002',
          notificationType: 'placement_instruction',
        },
        {
          recipientType: 'field_leader',
          recipientId: 'leader-site-003',
          notificationType: 'placement_instruction',
        },
      ],
    });
  });

  it('should execute with manual trigger for specified sites only', async () => {
    const input = {
      triggerType: 'manual_trigger',
      targetSiteIds: ['site-001', 'site-002', 'site-003'],
      delayRiskThreshold: 70,
      approverUserId: 'approver-user-1',
      approvalTimeoutMinutes: 30,
      executingUserId: 'executor-user-1',
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('completed');
    expect(result.delayRiskDetected).toBe(true);

    expect(result.affectedSites).toBeDefined();
    expect(result.affectedSites).toHaveLength(3);
    expect(result.affectedSites.map((site) => site.siteId)).toEqual([
      'site-001',
      'site-002',
      'site-003',
    ]);

    result.affectedSites.forEach((site) => {
      expect(['site-001', 'site-002', 'site-003']).toContain(site.siteId);
      expect(site.riskScore).toBeGreaterThanOrEqual(0);
      expect(site.riskScore).toBeLessThanOrEqual(100);
    });

    expect(result.placementProposalId).toBeDefined();
    expect(typeof result.placementProposalId).toBe('string');

    expect(result.placementProposalSummary).toBeDefined();
    expect(typeof result.placementProposalSummary).toBe('object');

    expect(result.approvalStatus).toBe('approved');

    expect(result.placementChangeHistoryId).toBeDefined();
    expect(typeof result.placementChangeHistoryId).toBe('string');

    expect(result.notificationsSent).toBeDefined();
    expect(Array.isArray(result.notificationsSent)).toBe(true);

    const fieldLeaderNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'field_leader' && n.notificationType === 'placement_instruction'
    );
    expect(fieldLeaderNotifications.length).toBeGreaterThan(0);

    expect(result.expectedProductivityImprovement).toBeDefined();
    expect(typeof result.expectedProductivityImprovement).toBe('number');
    expect(result.expectedProductivityImprovement).toBeGreaterThanOrEqual(0);
    expect(result.expectedProductivityImprovement).toBeLessThanOrEqual(100);

    expect(result.errorDetails).toBeUndefined();

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockAiClient.monitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(mockAiClient.orchestrateDataCollectionForDelayRisk).toHaveBeenCalledWith(
      expect.objectContaining({
        targetSiteIds: ['site-001', 'site-002', 'site-003'],
      })
    );
    expect(mockAiClient.deliverPlacementInstructionToFieldLeader).toHaveBeenCalled();
  });
});