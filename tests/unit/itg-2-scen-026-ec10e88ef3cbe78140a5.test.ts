import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

// Mock internal dependencies
jest.mock('../../src/agents/tx-3-imp-1/services/progress-monitor', () => ({
  monitorProgressAndDetectDelayRisk: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/data-collection', () => ({
  orchestrateDataCollectionForDelayRisk: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/placement-proposal', () => ({
  assessDeliveryRiskAndProposeAdjustments: jest.fn(),
  buildOptimalPlacementProposalScreen: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/notifications', () => ({
  sendProgressDelayRiskNotification: jest.fn(),
}));

jest.mock('../../src/agents/tx-3-imp-1/services/placement-execution', () => ({
  executePlacementChangeWithApproval: jest.fn(),
  deliverPlacementInstructionToFieldLeader: jest.fn(),
}));

describe('SCEN-026: 最適人員配置案の導出に失敗した場合は配置案生成失敗エラーで管理者に通知', () => {
  let mockMonitorProgressAndDetectDelayRisk: jest.Mock;
  let mockOrchestrateDataCollectionForDelayRisk: jest.Mock;
  let mockAssessDeliveryRiskAndProposeAdjustments: jest.Mock;
  let mockBuildOptimalPlacementProposalScreen: jest.Mock;
  let mockSendProgressDelayRiskNotification: jest.Mock;
  let mockExecutePlacementChangeWithApproval: jest.Mock;
  let mockDeliverPlacementInstructionToFieldLeader: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMonitorProgressAndDetectDelayRisk = require('../../src/agents/tx-3-imp-1/services/progress-monitor').monitorProgressAndDetectDelayRisk;
    mockOrchestrateDataCollectionForDelayRisk = require('../../src/agents/tx-3-imp-1/services/data-collection').orchestrateDataCollectionForDelayRisk;
    mockAssessDeliveryRiskAndProposeAdjustments = require('../../src/agents/tx-3-imp-1/services/placement-proposal').assessDeliveryRiskAndProposeAdjustments;
    mockBuildOptimalPlacementProposalScreen = require('../../src/agents/tx-3-imp-1/services/placement-proposal').buildOptimalPlacementProposalScreen;
    mockSendProgressDelayRiskNotification = require('../../src/agents/tx-3-imp-1/services/notifications').sendProgressDelayRiskNotification;
    mockExecutePlacementChangeWithApproval = require('../../src/agents/tx-3-imp-1/services/placement-execution').executePlacementChangeWithApproval;
    mockDeliverPlacementInstructionToFieldLeader = require('../../src/agents/tx-3-imp-1/services/placement-execution').deliverPlacementInstructionToFieldLeader;
  });

  it('should notify administrator with placement proposal generation failure when proposal derivation fails', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      triggerType: 'manual_trigger',
      delayRiskThreshold: 70,
      approverUserId: 'user001',
      executingUserId: 'user002',
    };

    // Setup stubs: delay risk detection succeeds (affectedSites has 1+ items)
    mockMonitorProgressAndDetectDelayRisk.mockResolvedValue({
      delayRiskDetected: true,
      affectedSites: [
        {
          siteId: 'site-001',
          riskScore: 85,
          affectedTeamIds: ['team-001'],
        },
      ],
    });

    mockOrchestrateDataCollectionForDelayRisk.mockResolvedValue({
      progressData: [{ siteId: 'site-001', progress: 50 }],
      productivityData: [{ siteId: 'site-001', productivity: 75 }],
    });

    // Setup stub: placement proposal derivation fails with skill matching error
    mockAssessDeliveryRiskAndProposeAdjustments.mockRejectedValue(
      new Error('スキルマッチ度評価エラー')
    );

    // Act
    const result = await runTx3Imp1Agent(input, {} as any);

    // Assert: Check execution status
    expect(result.executionStatus).toBe('failed');
    expect(result.delayRiskDetected).toBe(true);
    expect(result.affectedSites).toBeDefined();
    expect(result.affectedSites!.length).toBeGreaterThanOrEqual(1);

    // Assert: Check that proposal-related fields are undefined
    expect(result.placementProposalId).toBeUndefined();
    expect(result.placementChangeHistoryId).toBeUndefined();
    expect(result.approvalStatus).toBeUndefined();

    // Assert: Check error details contain the specific error code and exact message
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.errorCode).toBe('PlacementProposalGenerationFailure');
    expect(result.errorDetails?.message).toEqual(
      '最適人員配置案の生成に失敗しました。管理者に通知し、手動対応を依頼します。'
    );

    // Assert: buildOptimalPlacementProposalScreen was not called
    expect(mockBuildOptimalPlacementProposalScreen).toHaveBeenCalledTimes(0);

    // Assert: sendProgressDelayRiskNotification was called
    expect(mockSendProgressDelayRiskNotification).toHaveBeenCalled();
    const notificationCall = mockSendProgressDelayRiskNotification.mock.calls[0];
    expect(notificationCall).toBeDefined();

    // Assert: Placement instruction was not delivered to field leaders
    expect(mockDeliverPlacementInstructionToFieldLeader).toHaveBeenCalledTimes(0);
    expect(mockExecutePlacementChangeWithApproval).toHaveBeenCalledTimes(0);

    // Assert: Notifications include administrator notification with appropriate type
    expect(result.notificationsSent).toBeDefined();
    const adminNotifications = result.notificationsSent?.filter(
      (n) => n.recipientType === 'administrator'
    );
    expect(adminNotifications!.length).toBeGreaterThanOrEqual(1);
    expect(adminNotifications![0].notificationType).toBe(
      'placement_proposal_generation_failure'
    );
    expect(adminNotifications![0].recipientId).toBeDefined();
  });

  it('should not deliver placement instruction when proposal generation fails', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      triggerType: 'manual_trigger',
      delayRiskThreshold: 70,
      approverUserId: 'user001',
      executingUserId: 'user002',
    };

    // Setup stubs: delay risk detection succeeds
    mockMonitorProgressAndDetectDelayRisk.mockResolvedValue({
      delayRiskDetected: true,
      affectedSites: [
        {
          siteId: 'site-001',
          riskScore: 75,
          affectedTeamIds: ['team-001'],
        },
      ],
    });

    mockOrchestrateDataCollectionForDelayRisk.mockResolvedValue({
      progressData: [{ siteId: 'site-001', progress: 45 }],
      productivityData: [{ siteId: 'site-001', productivity: 70 }],
    });

    // Setup stub: placement proposal derivation fails with personnel allocation error
    mockAssessDeliveryRiskAndProposeAdjustments.mockRejectedValue(
      new Error('人員融通判定エラー')
    );

    // Act
    const result = await runTx3Imp1Agent(input, {} as any);

    // Assert
    expect(result.executionStatus).toBe('failed');
    expect(result.placementProposalId).toBeUndefined();
    expect(result.placementChangeHistoryId).toBeUndefined();
    expect(result.errorDetails?.errorCode).toBe('PlacementProposalGenerationFailure');
    expect(result.errorDetails?.message).toEqual(
      '最適人員配置案の生成に失敗しました。管理者に通知し、手動対応を依頼します。'
    );

    // Assert: No field leader notifications
    const fieldLeaderNotifications = result.notificationsSent?.filter(
      (n) => n.recipientType === 'field_leader'
    );
    expect(fieldLeaderNotifications).toHaveLength(0);

    // Assert: Administrator notification was sent
    const adminNotifications = result.notificationsSent?.filter(
      (n) => n.recipientType === 'administrator'
    );
    expect(adminNotifications!.length).toBeGreaterThanOrEqual(1);
    expect(adminNotifications![0].notificationType).toBe(
      'placement_proposal_generation_failure'
    );

    // Assert: Field leader delivery was not called
    expect(mockDeliverPlacementInstructionToFieldLeader).toHaveBeenCalledTimes(0);
  });

  it('should include error reason in notification when proposal generation fails', async () => {
    // Arrange
    const input: Tx3Imp1AgentInput = {
      triggerType: 'manual_trigger',
      delayRiskThreshold: 70,
      approverUserId: 'user001',
      executingUserId: 'user002',
    };

    // Setup stubs: delay risk detection succeeds
    mockMonitorProgressAndDetectDelayRisk.mockResolvedValue({
      delayRiskDetected: true,
      affectedSites: [
        {
          siteId: 'site-001',
          riskScore: 80,
          affectedTeamIds: ['team-001', 'team-002'],
        },
      ],
    });

    mockOrchestrateDataCollectionForDelayRisk.mockResolvedValue({
      progressData: [{ siteId: 'site-001', progress: 55 }],
      productivityData: [{ siteId: 'site-001', productivity: 78 }],
    });

    // Setup stub: placement proposal derivation fails
    mockAssessDeliveryRiskAndProposeAdjustments.mockRejectedValue(
      new Error('スキルマッチ度評価エラー')
    );

    // Act
    const result = await runTx3Imp1Agent(input, {} as any);

    // Assert
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent!.length).toBeGreaterThanOrEqual(1);

    const adminNotifications = result.notificationsSent?.filter(
      (n) => n.recipientType === 'administrator'
    );
    expect(adminNotifications!.length).toBeGreaterThanOrEqual(1);
    expect(adminNotifications![0].recipientId).toBeDefined();
    expect(adminNotifications![0].notificationType).toBe(
      'placement_proposal_generation_failure'
    );

    // Assert: sendProgressDelayRiskNotification was called
    expect(mockSendProgressDelayRiskNotification).toHaveBeenCalled();

    // Assert: No execution or delivery occurred
    expect(mockExecutePlacementChangeWithApproval).toHaveBeenCalledTimes(0);
    expect(mockBuildOptimalPlacementProposalScreen).toHaveBeenCalledTimes(0);
  });
});