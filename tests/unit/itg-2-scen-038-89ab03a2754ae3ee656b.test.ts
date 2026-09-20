import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-038: 現場リーダーへの配置指示配信が失敗した場合', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockMonitorProgressAndDetectDelayRisk: jest.Mock;
  let mockOrchestrateDataCollectionForDelayRisk: jest.Mock;
  let mockJudgePersonnelReallocationFeasibility: jest.Mock;
  let mockAssessDeliveryRiskAndProposeAdjustments: jest.Mock;
  let mockDeliverPlacementInstructionToFieldLeader: jest.Mock;
  let mockSendProgressDelayRiskNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateUser = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: 'USER123',
    });

    mockMonitorProgressAndDetectDelayRisk = jest.fn().mockResolvedValue([
      {
        siteId: 'SITE001',
        riskScore: 75,
        progressRate: 45,
        remainingTimeHours: 12,
        detectionTimestamp: new Date().toISOString(),
      },
    ]);

    mockOrchestrateDataCollectionForDelayRisk = jest.fn().mockResolvedValue({
      affectedSites: [
        {
          siteId: 'SITE001',
          siteName: 'Site A',
          requiredAdjustments: ['Increase team capacity'],
          currentTeamCapacity: 60,
          requiredCapacityIncrease: 20,
        },
      ],
    });

    mockJudgePersonnelReallocationFeasibility = jest.fn().mockResolvedValue({
      isFeasible: true,
      feasibilityScore: 85,
      constraints: [],
    });

    mockAssessDeliveryRiskAndProposeAdjustments = jest.fn().mockResolvedValue([
      {
        proposalId: 'PROP001',
        targetSiteId: 'SITE001',
        workerReallocationPlan: [
          {
            workerId: 'WORKER001',
            workerName: 'Worker A',
            sourceSiteId: 'SITE002',
            targetSiteId: 'SITE001',
            assignedWorkType: 'Assembly',
            skillMatchScore: 90,
            estimatedProductivityAtTarget: 85,
          },
        ],
        expectedProductivityImprovement: 15,
        estimatedDeliveryRiskReduction: 20,
        proposalGeneratedTimestamp: new Date().toISOString(),
      },
    ]);

    const deliveryError = new Error('配置指示の配信に失敗しました。管理者への通知を行い、手動対応を促します。');
    (deliveryError as any).errorCode = 'PlacementInstructionDeliveryFailure';
    mockDeliverPlacementInstructionToFieldLeader = jest.fn().mockRejectedValue(deliveryError);

    mockSendProgressDelayRiskNotification = jest.fn().mockResolvedValue({
      notificationId: 'NOTIF001',
      sentTo: 'ADMIN',
      timestamp: new Date().toISOString(),
    });
  });

  it('現場リーダーへの配置指示配信が失敗した場合、PlacementInstructionDeliveryFailureエラーが発生して管理者への通知に進む', async () => {
    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      monitorProgressAndDetectDelayRisk: mockMonitorProgressAndDetectDelayRisk,
      orchestrateDataCollectionForDelayRisk: mockOrchestrateDataCollectionForDelayRisk,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      assessDeliveryRiskAndProposeAdjustments: mockAssessDeliveryRiskAndProposeAdjustments,
      deliverPlacementInstructionToFieldLeader: mockDeliverPlacementInstructionToFieldLeader,
      sendProgressDelayRiskNotification: mockSendProgressDelayRiskNotification,
    };

    const result = await runTx4Imp1Agent(
      {
        triggerType: 'realtime_monitoring',
        monitoringIntervalSeconds: 300,
        targetSiteIds: ['SITE001', 'SITE002'],
        delayRiskThreshold: 70,
        executingUserId: 'USER123',
        contextData: {},
      },
      aiClient as any
    );

    expect(result.executionStatus).toBe('failure');

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails.length).toBeGreaterThan(0);

    const deliveryError = result.errorDetails.find(
      (err: any) => 
        err.errorCode === 'PlacementInstructionDeliveryFailure' || 
        (err.message && err.message.includes('配置指示の配信に失敗'))
    );

    expect(deliveryError).toBeDefined();
    expect(deliveryError.message || deliveryError.errorMessage || deliveryError.detail).toBe(
      '配置指示の配信に失敗しました。管理者への通知を行い、手動対応を促します。'
    );

    expect(result.deliveryInstructions).toBeDefined();
    expect(Array.isArray(result.deliveryInstructions)).toBe(true);

    const isEmpty = result.deliveryInstructions.length === 0;
    const hasFailedDeliveries = result.deliveryInstructions.length > 0 &&
      result.deliveryInstructions.some(
        (instruction: any) => instruction.deliveryStatus === 'failed'
      );

    expect(isEmpty || hasFailedDeliveries).toBe(true);

    expect(result.detectedDelayRisks).toBeDefined();
    expect(Array.isArray(result.detectedDelayRisks)).toBe(true);

    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');

    expect(mockSendProgressDelayRiskNotification).toHaveBeenCalled();
  });
});