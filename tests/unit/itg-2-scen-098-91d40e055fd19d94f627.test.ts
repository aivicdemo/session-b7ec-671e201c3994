import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-098: tx-6-imp-1 agent - optimal placement proposal generation failure', () => {
  it('should return failed status with error details when optimal placement proposal generation fails', async () => {
    // Arrange
    const executingUserId = 'user-123';
    const orderVolumeIncreaseContext = {
      detectionTimestamp: '2024-01-15T10:00:00Z',
      orderVolumePercentageIncrease: 45,
      affectedTeamIds: ['team-1', 'team-2'],
      affectedSiteIds: ['site-1'],
      orderDeadlineDate: '2024-01-20',
    };
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-15';

    const input = {
      orderVolumeIncreaseContext,
      analysisStartDate,
      analysisEndDate,
      executingUserId,
      dataRetrievalTimeoutMs: 30000,
      useCachedDataIfRetrievalFails: true,
    };

    // Create mock AI client with error scenarios
    const mockAiClient = {
      authenticateUser: jest.fn().mockResolvedValue({
        isValid: true,
        userId: executingUserId,
      }),
      monitorProgressAndDetectDelayRisk: jest
        .fn()
        .mockRejectedValue(
          new Error(
            'ProgressDataRetrievalFailed: 進捗データの取得に失敗しました。キャッシュデータを使用して処理を継続します。'
          )
        ),
      handleDataRetrievalFailureAndGeneratePlacement: jest
        .fn()
        .mockResolvedValue({
          usedCache: true,
          cachedDataTimestamp: '2024-01-15T09:00:00Z',
          multiTeamProgressData: [
            {
              teamId: 'team-1',
              currentProgressRate: 60,
              delayRiskScore: 75,
            },
            {
              teamId: 'team-2',
              currentProgressRate: 55,
              delayRiskScore: 80,
            },
          ],
          productivityPatternsByWorker: [
            {
              workerId: 'worker-1',
              averageProductivityRate: 85,
              workTypeStrengths: ['type-A', 'type-B'],
            },
          ],
        }),
      analyzeBusyPeriodProductivityAndProposePlacement: jest
        .fn()
        .mockRejectedValue(
          new Error(
            'OptimalPlacementProposalGenerationFailed: 最適人員配置案の生成に失敗しました。管理者に通知します。'
          )
        ),
      sendNotificationToAdministrator: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        sent: true,
        recipientType: 'administrator',
        notificationType: 'error_notification',
        timestamp: new Date().toISOString(),
      }),
      sendDeliveryInstructionToFieldLeader: jest.fn(),
    };

    // Act
    const output = await runTx6Imp1Agent(input, mockAiClient);

    // Assert - Verify execution status and placement proposal
    expect(output.executionStatus).toBe('failed');
    expect(output.placementProposalId).toBeNull();
    expect(output.deliveryInstructionStatus).toBe('failed');

    // Verify error details structure and content
    expect(output.errorDetails).not.toBeNull();
    expect(Array.isArray(output.errorDetails)).toBe(true);
    expect(output.errorDetails).toHaveLength(2);

    // Verify OptimalPlacementProposalGenerationFailed error
    const optimalPlacementError = output.errorDetails?.find(
      (err) => err.errorCode === 'OptimalPlacementProposalGenerationFailed'
    );
    expect(optimalPlacementError).toBeDefined();
    expect(optimalPlacementError?.errorMessage).toBe(
      '最適人員配置案の生成に失敗しました。管理者に通知します。'
    );
    expect(optimalPlacementError?.affectedComponent).toMatch(
      /最適人員配置案生成|placement/i
    );
    expect(optimalPlacementError?.recoveryAction).toBeDefined();
    expect(optimalPlacementError?.recoveryAction).toContain('管理者');

    // Verify ProgressDataRetrievalFailed error is recorded
    const progressDataError = output.errorDetails?.find(
      (err) => err.errorCode === 'ProgressDataRetrievalFailed'
    );
    expect(progressDataError).toBeDefined();
    expect(progressDataError?.errorMessage).toBe(
      '進捗データの取得に失敗しました。キャッシュデータを使用して処理を継続します。'
    );

    // Verify notifications were sent
    expect(output.notificationsSent).toBeDefined();
    expect(Array.isArray(output.notificationsSent)).toBe(true);
    expect(output.notificationsSent.length).toBeGreaterThanOrEqual(1);

    const administratorNotification = output.notificationsSent.find(
      (notif) => notif.recipientType === 'administrator'
    );
    expect(administratorNotification).toBeDefined();
    expect(administratorNotification?.notificationType).toBeDefined();
    expect(administratorNotification?.timestamp).toBeDefined();

    // Verify proposed placement changes
    expect(output.proposedPlacementChanges).toBeDefined();
    expect(Array.isArray(output.proposedPlacementChanges)).toBe(true);
    expect(output.proposedPlacementChanges.length).toBe(0);

    // Verify analysis result contains data from cache
    expect(output.analysisResult).toBeDefined();
    expect(output.analysisResult.multiTeamProgressData).toBeDefined();
    expect(output.analysisResult.multiTeamProgressData.length).toBeGreaterThan(0);
    expect(output.analysisResult.productivityPatternsByWorker).toBeDefined();
    expect(output.analysisResult.placementValidityScore).toBeDefined();

    // Verify mock calls and their order
    expect(mockAiClient.authenticateUser).toHaveBeenCalledWith(executingUserId);
    expect(mockAiClient.monitorProgressAndDetectDelayRisk).toHaveBeenCalled();
    expect(
      mockAiClient.handleDataRetrievalFailureAndGeneratePlacement
    ).toHaveBeenCalled();
    expect(
      mockAiClient.analyzeBusyPeriodProductivityAndProposePlacement
    ).toHaveBeenCalled();
    expect(mockAiClient.sendNotificationToAdministrator).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientType: 'administrator',
      })
    );

    // Verify execution timestamp
    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');
    expect(() => new Date(output.executionTimestamp)).not.toThrow();
  });
});