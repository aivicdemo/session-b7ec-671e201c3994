import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-096: tx-6-imp-1 partial_success on progress data retrieval failure with cache', () => {
  let mockMonitorProgressAndDetectDelayRisk: jest.Mock;
  let mockHandleDataRetrievalFailureAndGeneratePlacement: jest.Mock;
  let mockVerifyAndScoreAnalysisResult: jest.Mock;
  let mockExecutePlacementChangeWithApproval: jest.Mock;
  let mockDeliverPlacementInstructionToFieldLeader: jest.Mock;
  let mockSendNotificationToAdministrator: jest.Mock;
  let mockAuthenticateUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMonitorProgressAndDetectDelayRisk = jest.fn().mockRejectedValue(
      new Error('ProgressDataRetrievalFailed: Timeout waiting for progress data')
    );

    mockHandleDataRetrievalFailureAndGeneratePlacement = jest.fn().mockResolvedValue({
      proposedPlacementChanges: [
        {
          workerId: 'worker-001',
          currentTeamId: 'team-a',
          proposedTeamId: 'team-b',
          proposedDepartmentId: 'dept-001',
          expectedProductivityImprovement: 0.15,
          skillMatchScore: 0.82,
        },
        {
          workerId: 'worker-002',
          currentTeamId: 'team-b',
          proposedTeamId: 'team-a',
          proposedDepartmentId: 'dept-002',
          expectedProductivityImprovement: 0.12,
          skillMatchScore: 0.78,
        },
      ],
      analysisResult: {
        multiTeamProgressData: [
          {
            teamId: 'team-a',
            currentProgressRate: 65,
            delayRiskScore: 0.72,
          },
          {
            teamId: 'team-b',
            currentProgressRate: 45,
            delayRiskScore: 0.88,
          },
        ],
        productivityPatternsByWorker: [
          {
            workerId: 'worker-001',
            averageProductivityRate: 0.92,
            workTypeStrengths: ['assembly', 'inspection'],
          },
          {
            workerId: 'worker-002',
            averageProductivityRate: 0.88,
            workTypeStrengths: ['packaging', 'labeling'],
          },
        ],
        placementValidityScore: 0.78,
        placementValidityReason: 'キャッシュデータを使用した配置案',
      },
    });

    mockVerifyAndScoreAnalysisResult = jest.fn().mockResolvedValue({
      placementValidityScore: 0.78,
      placementValidityReason: 'キャッシュデータを使用した配置案',
    });

    mockExecutePlacementChangeWithApproval = jest.fn().mockResolvedValue({
      success: true,
      placementProposalId: 'proposal-cache-12345',
    });

    mockDeliverPlacementInstructionToFieldLeader = jest.fn().mockResolvedValue({
      deliveryInstructionStatus: 'delivered',
      notificationsSent: [
        {
          recipientType: 'administrator',
          recipientId: 'admin-001',
          notificationType: 'data_retrieval_failure_warning',
          timestamp: new Date().toISOString(),
        },
        {
          recipientType: 'field_leader',
          recipientId: 'leader-001',
          notificationType: 'placement_instruction',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    mockSendNotificationToAdministrator = jest.fn().mockResolvedValue({
      success: true,
    });

    mockAuthenticateUser = jest.fn().mockResolvedValue({
      authenticated: true,
      userId: 'user-12345',
    });
  });

  it('should return partial_success when progress data retrieval fails but cache is available and usable', async () => {
    const testInput = {
      orderVolumeIncreaseContext: {
        detectionTimestamp: new Date().toISOString(),
        orderVolumePercentageIncrease: 35,
        affectedTeamIds: ['team-a', 'team-b'],
        affectedSiteIds: ['site-001', 'site-002'],
        orderDeadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      analysisStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      analysisEndDate: new Date().toISOString(),
      executingUserId: 'user-12345',
      dataRetrievalTimeoutMs: 100,
      useCachedDataIfRetrievalFails: true,
    };

    const aiClient = {
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      handleDataRetrievalFailureAndGeneratePlacement: mockHandleDataRetrievalFailureAndGeneratePlacement,
      verifyAndScoreAnalysisResult: mockVerifyAndScoreAnalysisResult,
      executePlacementChangeWithApproval: mockExecutePlacementChangeWithApproval,
      deliverPlacementInstructionToFieldLeader: mockDeliverPlacementInstructionToFieldLeader,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
      authenticateUser: mockAuthenticateUser,
    };

    const result = await runTx6Imp1Agent(testInput, aiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.placementProposalId).not.toBeNull();
    expect(result.proposedPlacementChanges).toHaveLength(2);
    expect(result.proposedPlacementChanges[0]).toMatchObject({
      workerId: 'worker-001',
      currentTeamId: 'team-a',
      proposedTeamId: 'team-b',
      expectedProductivityImprovement: 0.15,
      skillMatchScore: 0.82,
    });
    expect(result.proposedPlacementChanges[1]).toMatchObject({
      workerId: 'worker-002',
      currentTeamId: 'team-b',
      proposedTeamId: 'team-a',
      expectedProductivityImprovement: 0.12,
      skillMatchScore: 0.78,
    });
    
    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.multiTeamProgressData).toHaveLength(2);
    expect(result.analysisResult.multiTeamProgressData[0]).toMatchObject({
      teamId: 'team-a',
      currentProgressRate: 65,
      delayRiskScore: 0.72,
    });
    expect(result.analysisResult.multiTeamProgressData[1]).toMatchObject({
      teamId: 'team-b',
      currentProgressRate: 45,
      delayRiskScore: 0.88,
    });

    expect(result.analysisResult.productivityPatternsByWorker).toHaveLength(2);
    expect(result.analysisResult.productivityPatternsByWorker[0]).toMatchObject({
      workerId: 'worker-001',
      averageProductivityRate: 0.92,
      workTypeStrengths: ['assembly', 'inspection'],
    });

    expect(result.analysisResult.placementValidityScore).toBeGreaterThanOrEqual(0.75);
    expect(result.analysisResult.placementValidityReason).toContain('キャッシュデータを使用した配置案');

    expect(result.deliveryInstructionStatus).toBe('delivered');
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent.length).toBeGreaterThanOrEqual(1);
    const warningNotification = result.notificationsSent.find(
      n => n.notificationType === 'data_retrieval_failure_warning' || n.notificationType.includes('warning')
    );
    expect(warningNotification).toBeDefined();

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails[0]).toMatchObject({
      errorCode: 'ProgressDataRetrievalFailed',
      errorMessage: expect.stringContaining('進捗データの取得に失敗'),
      affectedComponent: 'monitorProgressAndDetectDelayRisk',
      recoveryAction: expect.stringContaining('キャッシュデータ'),
    });

    expect(result.executionTimestamp).toBeDefined();
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });
});