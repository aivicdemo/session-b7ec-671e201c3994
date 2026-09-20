import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AgentInput, Tx6Imp1AgentOutput } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-097: 生産性データの分析に失敗したとき、前回の分析結果を使用して partial_success で完了する', () => {
  let mockMonitorProgressAndDetectDelayRisk: jest.Mock;
  let mockAnalyzeBusyPeriodProductivityAndProposePlacement: jest.Mock;
  let mockHandleDataRetrievalFailureAndGeneratePlacement: jest.Mock;
  let mockVerifyAndScoreAnalysisResult: jest.Mock;
  let mockExecutePlacementChangeWithApproval: jest.Mock;
  let mockDeliverPlacementInstructionToFieldLeader: jest.Mock;
  let mockSendNotificationToAdministrator: jest.Mock;
  let mockAuthenticateUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMonitorProgressAndDetectDelayRisk = jest.fn().mockResolvedValue({
      detectedDelayRisk: true,
      affectedTeamIds: ['TEAM-A', 'TEAM-B'],
      affectedSiteIds: ['SITE-001', 'SITE-002'],
      multiTeamProgressData: [
        {
          teamId: 'TEAM-A',
          currentProgressRate: 0.65,
          delayRiskScore: 0.45,
        },
        {
          teamId: 'TEAM-B',
          currentProgressRate: 0.55,
          delayRiskScore: 0.65,
        },
      ],
    });

    mockAnalyzeBusyPeriodProductivityAndProposePlacement = jest.fn().mockRejectedValue(
      new Error('ProductivityDataAnalysisFailedエラー')
    );

    const cachedAnalysisResult = {
      multiTeamProgressData: [
        {
          teamId: 'TEAM-A',
          currentProgressRate: 0.65,
          delayRiskScore: 0.45,
        },
        {
          teamId: 'TEAM-B',
          currentProgressRate: 0.55,
          delayRiskScore: 0.65,
        },
      ],
      productivityPatternsByWorker: [
        {
          workerId: 'W001',
          averageProductivityRate: 0.92,
          workTypeStrengths: ['assembly', 'quality_check'],
        },
        {
          workerId: 'W002',
          averageProductivityRate: 0.88,
          workTypeStrengths: ['packaging', 'labeling'],
        },
      ],
      placementValidityScore: 0.78,
      placementValidityReason: 'キャッシュ分析結果の妥当性確認済み',
    };

    mockHandleDataRetrievalFailureAndGeneratePlacement = jest.fn().mockResolvedValue({
      analysisResult: cachedAnalysisResult,
      proposedPlacementChanges: [
        {
          workerId: 'W001',
          currentTeamId: 'TEAM-A',
          proposedTeamId: 'TEAM-B',
          proposedDepartmentId: 'DEPT-MFG',
          expectedProductivityImprovement: 0.15,
          skillMatchScore: 0.92,
        },
      ],
    });

    mockVerifyAndScoreAnalysisResult = jest.fn().mockResolvedValue({
      analysisResult: cachedAnalysisResult,
      isValid: true,
    });

    mockExecutePlacementChangeWithApproval = jest.fn().mockResolvedValue({
      placementProposalId: 'PROPOSAL-20240115-001',
      approved: true,
      proposedPlacementChanges: [
        {
          workerId: 'W001',
          currentTeamId: 'TEAM-A',
          proposedTeamId: 'TEAM-B',
          proposedDepartmentId: 'DEPT-MFG',
          expectedProductivityImprovement: 0.15,
          skillMatchScore: 0.92,
        },
      ],
    });

    mockDeliverPlacementInstructionToFieldLeader = jest.fn().mockResolvedValue({
      delivered: true,
      notificationsSent: [
        {
          recipientType: 'field_leader' as const,
          recipientId: 'FL-001',
          notificationType: 'placement_instruction',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    mockSendNotificationToAdministrator = jest.fn().mockResolvedValue({
      sent: true,
      notification: {
        recipientType: 'administrator' as const,
        recipientId: 'ADMIN-001',
        notificationType: 'partial_success_with_cached_analysis',
        timestamp: new Date().toISOString(),
      },
    });

    mockAuthenticateUser = jest.fn().mockResolvedValue({
      authenticated: true,
      userId: 'USER-001',
    });
  });

  it('生産性データの分析に失敗したとき、前回の分析結果を使用して partial_success で完了する', async () => {
    const input: Tx6Imp1AgentInput = {
      orderVolumeIncreaseContext: {
        detectionTimestamp: '2024-01-15T10:00:00Z',
        orderVolumePercentageIncrease: 0.35,
        affectedTeamIds: ['TEAM-A', 'TEAM-B'],
        affectedSiteIds: ['SITE-001', 'SITE-002'],
        orderDeadlineDate: '2024-01-25',
      },
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-15',
      executingUserId: 'USER-001',
      dataRetrievalTimeoutMs: 30000,
      useCachedDataIfRetrievalFails: true,
    };

    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(input, {
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      analyzeBusyPeriodProductivityAndProposePlacement: mockAnalyzeBusyPeriodProductivityAndProposePlacement,
      handleDataRetrievalFailureAndGeneratePlacement: mockHandleDataRetrievalFailureAndGeneratePlacement,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      executePlacementChangeWithApproval: mockExecutePlacementChangeWithApproval,
      deliverPlacementInstructionToFieldLeader: mockDeliverPlacementInstructionToFieldLeader,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
      authenticateUser: mockAuthenticateUser,
    });

    // 1. executionStatus が 'partial_success'
    expect(result.executionStatus).toBe('partial_success');

    // 2. errorDetails が適切なエラー情報を含むこと
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'PRODUCTIVITY_ANALYSIS_ERROR',
          errorMessage: expect.stringContaining('生産性データの分析に失敗'),
          affectedComponent: 'analyzeBusyPeriodProductivityAndProposePlacement',
          recoveryAction: expect.stringContaining('キャッシュデータを使用'),
        }),
      ])
    );

    // 3. placementProposalId が有効であること
    expect(result.placementProposalId).not.toBeNull();
    expect(typeof result.placementProposalId).toBe('string');
    expect(result.placementProposalId).toBeTruthy();

    // 4. proposedPlacementChanges が配置変更を含むこと
    expect(Array.isArray(result.proposedPlacementChanges)).toBe(true);
    expect(result.proposedPlacementChanges.length).toBeGreaterThanOrEqual(1);

    result.proposedPlacementChanges.forEach((change) => {
      expect(change).toHaveProperty('workerId');
      expect(change).toHaveProperty('currentTeamId');
      expect(change).toHaveProperty('proposedTeamId');
      expect(change).toHaveProperty('proposedDepartmentId');
      expect(change).toHaveProperty('expectedProductivityImprovement');
      expect(change).toHaveProperty('skillMatchScore');

      expect(typeof change.expectedProductivityImprovement).toBe('number');
      expect(change.expectedProductivityImprovement).toBeGreaterThanOrEqual(0);
      expect(change.expectedProductivityImprovement).toBeLessThanOrEqual(1);

      expect(typeof change.skillMatchScore).toBe('number');
      expect(change.skillMatchScore).toBeGreaterThanOrEqual(0);
      expect(change.skillMatchScore).toBeLessThanOrEqual(1);
    });

    // 5. analysisResult が適切な構造を持つこと
    expect(result.analysisResult).toHaveProperty('multiTeamProgressData');
    expect(result.analysisResult).toHaveProperty('productivityPatternsByWorker');
    expect(result.analysisResult).toHaveProperty('placementValidityScore');
    expect(result.analysisResult).toHaveProperty('placementValidityReason');

    expect(Array.isArray(result.analysisResult.multiTeamProgressData)).toBe(true);
    result.analysisResult.multiTeamProgressData.forEach((team) => {
      expect(team).toHaveProperty('teamId');
      expect(team).toHaveProperty('currentProgressRate');
      expect(team).toHaveProperty('delayRiskScore');
    });

    expect(Array.isArray(result.analysisResult.productivityPatternsByWorker)).toBe(true);
    result.analysisResult.productivityPatternsByWorker.forEach((worker) => {
      expect(worker).toHaveProperty('workerId');
      expect(worker).toHaveProperty('averageProductivityRate');
      expect(worker).toHaveProperty('workTypeStrengths');
    });

    expect(result.analysisResult.placementValidityScore).toBe(0.78);
    expect(result.analysisResult.placementValidityReason).toBe('キャッシュ分析結果の妥当性確認済み');

    // 6. deliveryInstructionStatus が 'delivered'
    expect(result.deliveryInstructionStatus).toBe('delivered');

    // 7. notificationsSent が配信完了の通知を含むこと
    expect(Array.isArray(result.notificationsSent)).toBe(true);
    expect(result.notificationsSent.length).toBeGreaterThanOrEqual(2);

    const fieldLeaderNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'field_leader'
    );
    expect(fieldLeaderNotifications.length).toBeGreaterThanOrEqual(1);

    const administratorNotifications = result.notificationsSent.filter(
      (n) => n.recipientType === 'administrator'
    );
    expect(administratorNotifications.length).toBeGreaterThanOrEqual(1);

    const partialSuccessNotifications = result.notificationsSent.filter(
      (n) => n.notificationType === 'partial_success_with_cached_analysis'
    );
    expect(partialSuccessNotifications.length).toBeGreaterThanOrEqual(1);

    result.notificationsSent.forEach((notification) => {
      expect(notification).toHaveProperty('recipientType');
      expect(notification).toHaveProperty('recipientId');
      expect(notification).toHaveProperty('notificationType');
      expect(notification).toHaveProperty('timestamp');

      const timestamp = new Date(notification.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    // 8. executionTimestamp が有効な ISO 8601形式
    const executionTimestamp = new Date(result.executionTimestamp);
    expect(executionTimestamp.getTime()).toBeGreaterThan(0);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});