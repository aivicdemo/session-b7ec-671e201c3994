import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

jest.mock('../../src/agents/tx-3-imp-1/actions/monitorProgressAndDetectDelayRisk');
jest.mock('../../src/agents/tx-3-imp-1/actions/orchestrateDataCollectionForDelayRisk');
jest.mock('../../src/agents/tx-3-imp-1/actions/assessDeliveryRiskAndProposeAdjustments');
jest.mock('../../src/agents/tx-3-imp-1/actions/executePlacementChangeWithApproval');
jest.mock('../../src/agents/tx-3-imp-1/actions/deliverPlacementInstructionToFieldLeader');

import * as monitorProgressModule from '../../src/agents/tx-3-imp-1/actions/monitorProgressAndDetectDelayRisk';
import * as dataCollectionModule from '../../src/agents/tx-3-imp-1/actions/orchestrateDataCollectionForDelayRisk';
import * as assessRiskModule from '../../src/agents/tx-3-imp-1/actions/assessDeliveryRiskAndProposeAdjustments';
import * as executePlacementModule from '../../src/agents/tx-3-imp-1/actions/executePlacementChangeWithApproval';
import * as deliverInstructionModule from '../../src/agents/tx-3-imp-1/actions/deliverPlacementInstructionToFieldLeader';

describe('SCEN-032: アラート昇格トリガーでカスタム遅延リスク閾値が適用される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect delay risk above custom threshold and execute placement instructions', async () => {
    const mockMonitorProgress = monitorProgressModule.monitorProgressAndDetectDelayRisk as jest.Mock;
    const mockDataCollection = dataCollectionModule.orchestrateDataCollectionForDelayRisk as jest.Mock;
    const mockAssessRisk = assessRiskModule.assessDeliveryRiskAndProposeAdjustments as jest.Mock;
    const mockExecutePlacement = executePlacementModule.executePlacementChangeWithApproval as jest.Mock;
    const mockDeliverInstruction = deliverInstructionModule.deliverPlacementInstructionToFieldLeader as jest.Mock;

    mockMonitorProgress.mockResolvedValueOnce({
      delayRiskDetected: true,
      affectedSites: [
        { siteId: 'site_001', riskScore: 75, affectedTeamIds: ['team_001'] },
        { siteId: 'site_002', riskScore: 75, affectedTeamIds: ['team_002'] }
      ]
    });

    mockDataCollection.mockResolvedValueOnce({
      success: true,
      data: { progressData: {}, productivityData: {} }
    });

    mockAssessRisk.mockResolvedValueOnce({
      placementProposalId: 'proposal_12345',
      expectedProductivityImprovement: 12
    });

    mockExecutePlacement.mockResolvedValueOnce({
      approvalStatus: 'approved',
      placementChangeHistoryId: 'history_67890'
    });

    mockDeliverInstruction.mockResolvedValueOnce({
      notificationsSent: [
        { recipientType: 'field_leader', recipientId: 'leader_001', notificationType: 'placement_instruction' },
        { recipientType: 'field_leader', recipientId: 'leader_002', notificationType: 'placement_instruction' }
      ]
    });

    const input: Tx3Imp1AgentInput = {
      triggerType: 'alert_escalation',
      targetSiteIds: ['site_001', 'site_002'],
      delayRiskThreshold: 65,
      approverUserId: 'approver_user_123',
      approvalTimeoutMinutes: 30,
      executingUserId: 'executor_user_456'
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {} as any);

    expect(output.executionStatus).toBe('completed');
    expect(output.delayRiskDetected).toBe(true);
    expect(output.affectedSites).toBeDefined();
    expect(output.affectedSites).toHaveLength(2);
    expect(output.affectedSites![0].siteId).toBe('site_001');
    expect(output.affectedSites![0].riskScore).toBe(75);
    expect(output.affectedSites![1].siteId).toBe('site_002');
    expect(output.affectedSites![1].riskScore).toBe(75);
    expect(output.placementProposalId).toBe('proposal_12345');
    expect(output.approvalStatus).toBe('approved');
    expect(output.notificationsSent).toBeDefined();
    expect(output.notificationsSent).toHaveLength(2);
    expect(output.notificationsSent![0].recipientType).toBe('field_leader');
    expect(output.notificationsSent![0].notificationType).toBe('placement_instruction');
    expect(output.executionTimestamp).toBeDefined();

    expect(mockMonitorProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'alert_escalation',
        targetSiteIds: ['site_001', 'site_002'],
        delayRiskThreshold: 65
      })
    );

    expect(mockDataCollection).toHaveBeenCalled();
    expect(mockAssessRisk).toHaveBeenCalled();
    expect(mockExecutePlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        approverUserId: 'approver_user_123',
        approvalTimeoutMinutes: 30
      })
    );
    expect(mockDeliverInstruction).toHaveBeenCalled();
  });
});