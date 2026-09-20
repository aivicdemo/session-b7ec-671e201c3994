import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as progressMonitoring from '../../src/logic/progress-monitoring';
import * as dataCollectionOrchestration from '../../src/logic/data-collection-orchestration';
import * as optimalPlacementProposal from '../../src/logic/optimal-placement-proposal-presentation';
import * as placementChangeExecution from '../../src/logic/placement-change-execution';
import * as notificationIntegration from '../../src/logic/notification-and-integration';

jest.mock('../../src/logic/progress-monitoring');
jest.mock('../../src/logic/data-collection-orchestration');
jest.mock('../../src/logic/optimal-placement-proposal-presentation');
jest.mock('../../src/logic/placement-change-execution');
jest.mock('../../src/logic/notification-and-integration');

describe('SCEN-027: 承認タイムアウト時の配置指示配信中止', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('承認者への配置案提示後にタイムアウト時間内に承認が得られない場合は承認タイムアウトで配置指示配信中止', async () => {
    const affectedSites = [
      { siteId: 'site_001', riskScore: 85, affectedTeamIds: ['team_A'] },
      { siteId: 'site_002', riskScore: 75, affectedTeamIds: ['team_B'] },
    ];

    (progressMonitoring.monitorProgressAndDetectDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskDetected: true,
      affectedSites,
    });

    (dataCollectionOrchestration.orchestrateDataCollectionForDelayRisk as jest.Mock).mockResolvedValue({
      progressData: { /* リアルタイムデータ */ },
      productivityData: { /* 生産性データ */ },
    });

    const proposalSummary = {
      proposalDetails: 'test proposal',
    };

    (optimalPlacementProposal.buildOptimalPlacementProposalScreen as jest.Mock).mockResolvedValue({
      placementProposalId: 'proposal_001',
      placementProposalSummary: proposalSummary,
      expectedProductivityImprovement: 15,
    });

    const approvalTimeoutError = new Error('配置案の承認がタイムアウトまたは却下されました。配置指示配信を中止します。');
    (approvalTimeoutError as any).code = 'ApprovalTimeoutOrRejection';
    (placementChangeExecution.executePlacementChangeWithApproval as jest.Mock).mockRejectedValue(
      approvalTimeoutError
    );

    (notificationIntegration.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue({
      notificationsSent: [
        { recipientType: 'approver', recipientId: 'approver_001', notificationType: 'placement_proposal_request' },
        { recipientType: 'admin', recipientId: null, notificationType: 'approval_timeout_alert' },
      ],
    });

    const input = {
      triggerType: 'scheduled_monitoring',
      targetSiteIds: ['site_001', 'site_002'],
      delayRiskThreshold: 70,
      approverUserId: 'approver_001',
      approvalTimeoutMinutes: 1,
      executingUserId: 'executor_001',
    };

    const result = await runTx3Imp1Agent(input, {} as any);

    expect(result.executionStatus).toBe('approval_timeout');
    expect(result.delayRiskDetected).toBe(true);
    expect(result.affectedSites).toEqual(affectedSites);
    expect(result.placementProposalId).toBe('proposal_001');
    expect(result.placementProposalSummary).toEqual(proposalSummary);
    expect(result.expectedProductivityImprovement).toBe(15);
    expect(result.approvalStatus).toBe('timeout');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails.message).toContain('配置案の承認がタイムアウトまたは却下されました');
    expect(result.notificationsSent).toEqual([
      { recipientType: 'approver', recipientId: 'approver_001', notificationType: 'placement_proposal_request' },
      { recipientType: 'admin', recipientId: null, notificationType: 'approval_timeout_alert' },
    ]);
    expect(result.placementChangeHistoryId).toBeUndefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(progressMonitoring.monitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(dataCollectionOrchestration.orchestrateDataCollectionForDelayRisk).toHaveBeenCalled();
    expect(optimalPlacementProposal.buildOptimalPlacementProposalScreen).toHaveBeenCalled();
    expect(placementChangeExecution.executePlacementChangeWithApproval).toHaveBeenCalled();
  });
});