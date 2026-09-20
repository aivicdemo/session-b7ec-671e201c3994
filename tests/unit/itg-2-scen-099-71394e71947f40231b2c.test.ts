import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-099: 配置指示の現場リーダーへの配信に失敗したとき、管理者に通知して failed を返す', () => {
  it('配置指示配信失敗時に failed ステータスを返し、管理者に通知する', async () => {
    // テストデータの準備
    const orderVolumeIncreaseContext = {
      detectionTimestamp: '2024-01-15T09:00:00Z',
      orderVolumePercentageIncrease: 45,
      affectedTeamIds: ['team-001', 'team-002'],
      affectedSiteIds: ['site-001'],
      orderDeadlineDate: '2024-01-20',
    };

    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-15';
    const executingUserId = 'user-123';

    const mockAiClient = {
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskDetected: true,
        affectedTeamIds: ['team-001', 'team-002'],
      }),

      analyzeBusyPeriodProductivityAndProposePlacement: jest.fn().mockResolvedValue({
        placementProposalId: 'proposal-001',
        proposedPlacementChanges: [
          {
            workerId: 'worker-001',
            currentTeamId: 'team-001',
            proposedTeamId: 'team-002',
            proposedDepartmentId: 'dept-002',
            expectedProductivityImprovement: 15,
            skillMatchScore: 0.85,
          },
        ],
      }),

      verifyAndScoreAnalysisResult: jest.fn().mockResolvedValue({
        analysisResult: {
          multiTeamProgressData: [
            {
              teamId: 'team-001',
              currentProgressRate: 60,
              delayRiskScore: 0.75,
            },
            {
              teamId: 'team-002',
              currentProgressRate: 50,
              delayRiskScore: 0.85,
            },
          ],
          productivityPatternsByWorker: [
            {
              workerId: 'worker-001',
              averageProductivityRate: 85,
              workTypeStrengths: ['assembly', 'inspection'],
            },
          ],
          placementValidityScore: 0.9,
          placementValidityReason: '提案された配置は生産性向上が期待でき、スキルマッチも高い',
        },
      }),

      executePlacementChangeWithApproval: jest.fn().mockResolvedValue({
        placementProposalId: 'proposal-001',
        proposedPlacementChanges: [
          {
            workerId: 'worker-001',
            currentTeamId: 'team-001',
            proposedTeamId: 'team-002',
            proposedDepartmentId: 'dept-002',
            expectedProductivityImprovement: 15,
            skillMatchScore: 0.85,
          },
        ],
      }),

      deliverPlacementInstructionToFieldLeader: jest.fn().mockResolvedValue({
        deliveryInstructionStatus: 'failed',
        notificationsSent: [],
      }),

      sendNotificationToAdministrator: jest.fn().mockResolvedValue({
        notificationsSent: [
          {
            recipientType: 'administrator' as const,
            recipientId: 'admin-001',
            notificationType: 'PlacementInstructionDeliveryFailed',
            timestamp: '2024-01-15T09:15:00Z',
          },
        ],
      }),
    };

    // runTx6Imp1Agent 関数を呼び出す
    const result = await runTx6Imp1Agent(
      {
        orderVolumeIncreaseContext,
        analysisStartDate,
        analysisEndDate,
        executingUserId,
        dataRetrievalTimeoutMs: 30000,
        useCachedDataIfRetrievalFails: true,
      },
      mockAiClient
    );

    // executionStatus が 'failed' であることを検証
    expect(result.executionStatus).toBe('failed');

    // deliveryInstructionStatus が 'failed' であることを検証
    expect(result.deliveryInstructionStatus).toBe('failed');

    // placementProposalId が null であることを検証
    expect(result.placementProposalId).toBeNull();

    // notificationsSent が配列で、管理者向け通知を含むことを検証
    expect(result.notificationsSent).toBeInstanceOf(Array);
    const adminNotification = result.notificationsSent.find(
      (n) =>
        n.recipientType === 'administrator' &&
        n.notificationType === 'PlacementInstructionDeliveryFailed'
    );
    expect(adminNotification).toBeDefined();
    expect(adminNotification?.recipientId).toBeTruthy();
    expect(adminNotification?.timestamp).toBeTruthy();

    // errorDetails が null ではなく配列であることを検証
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toBeInstanceOf(Array);

    // errorDetails 配列に適切なエラーレコードが存在することを検証
    const deliveryFailureError = result.errorDetails!.find(
      (e) => e.errorCode === 'PlacementInstructionDeliveryFailed'
    );
    expect(deliveryFailureError).toBeDefined();
    expect(deliveryFailureError?.errorMessage).toBe('配置指示の配信に失敗しました。管理者に通知します。');
    expect(deliveryFailureError?.affectedComponent).toBe('notification-and-integration');
    expect(deliveryFailureError?.recoveryAction).toBe('sendNotificationToAdministrator');

    // executionTimestamp が ISO 8601 形式であることを検証
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // sendNotificationToAdministrator が正確に 1 回呼び出されていることを検証
    expect(mockAiClient.sendNotificationToAdministrator).toHaveBeenCalledTimes(1);
  });
});