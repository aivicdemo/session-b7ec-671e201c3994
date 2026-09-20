import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-033: 承認タイムアウト時間がカスタム値で指定された場合にその時間が適用される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('カスタム指定の45分をタイムアウト判定の基準値として適用し、タイムアウトを検知する', async () => {
    // Arrange: 入力値を構築
    const customTimeoutMinutes = 45;
    const input: Tx3Imp1AgentInput = {
      triggerType: 'manual_trigger',
      targetSiteIds: undefined, // 全330拠点対象
      delayRiskThreshold: 70,
      approverUserId: 'user-001',
      approvalTimeoutMinutes: customTimeoutMinutes, // カスタム値45分
      executingUserId: 'user-002',
    };

    // 時間経過をシミュレートするための設定
    jest.useFakeTimers();
    const startTime = new Date('2024-01-01T00:00:00Z');
    jest.setSystemTime(startTime);

    // executePlacementChangeWithApprovalの呼び出しを追跡するためのモック関数
    const executePlacementChangeWithApprovalMock = jest.fn();
    let approvalTimeoutMinutesReceived: number | undefined;

    // Act: エージェントを実行
    const aiClientMock = {
      monitorProgressAndDetectDelayRisk: jest.fn().mockResolvedValue({
        delayRiskDetected: true,
        affectedSites: [
          {
            siteId: 'site-001',
            riskScore: 75,
            affectedTeamIds: ['team-001', 'team-002'],
          },
          {
            siteId: 'site-002',
            riskScore: 80,
            affectedTeamIds: ['team-003'],
          },
        ],
      }),
      orchestrateDataCollectionForDelayRisk: jest.fn().mockResolvedValue({
        dataCollected: true,
      }),
      buildOptimalPlacementProposalScreen: jest.fn().mockResolvedValue({
        placementProposalId: 'proposal-12345',
      }),
      authorizeUserAction: jest.fn().mockResolvedValue({
        authorized: true,
      }),
      executePlacementChangeWithApproval: executePlacementChangeWithApprovalMock.mockImplementation(
        async (args: any) => {
          // カスタム指定の45分がパラメータとして渡されていることを保存
          approvalTimeoutMinutesReceived = args.approvalTimeoutMinutes;

          // カスタム指定の45分後の時間経過をシミュレート
          jest.advanceTimersByTime(customTimeoutMinutes * 60 * 1000);

          // タイムアウト判定を返す
          return {
            approvalStatus: 'timeout',
          };
        }
      ),
    } as any;

    const result = await runTx3Imp1Agent(input, aiClientMock);

    // Assert: 実装が入力値のカスタム45分を基準にタイムアウト判定を行ったことを検証
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('approval_timeout');
    expect(result.approvalStatus).toBe('timeout');

    // errorDetailsが正しく設定されていることを確認
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.message).toBe(
      '配置案の承認がタイムアウトまたは却下されました。配置指示配信を中止します。'
    );

    // executePlacementChangeWithApprovalが呼び出されたことを確認
    expect(executePlacementChangeWithApprovalMock).toHaveBeenCalled();

    // executePlacementChangeWithApprovalが呼び出される際にカスタムタイムアウト値をパラメータとして受け取ったことを検証
    // 実装関数がこの値を実際に受け取ったことを確認
    expect(approvalTimeoutMinutesReceived).toBe(customTimeoutMinutes);
    expect(approvalTimeoutMinutesReceived).toBe(input.approvalTimeoutMinutes);

    // 承認タイムアウト通知が送信されていることを確認
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent?.length).toBeGreaterThanOrEqual(1);

    // 承認者への通知が含まれていることを確認
    const approverNotification = result.notificationsSent?.find(
      (n) => n.recipientId === 'user-001'
    );
    expect(approverNotification).toBeDefined();
    expect(approverNotification?.recipientType).toBe('approver');
    expect(approverNotification?.notificationType).toBe('approval_timeout_notification');

    // 配置変更履歴は生成されていないことを確認
    expect(result.placementChangeHistoryId).toBeUndefined();

    // タイムスタンプがISO 8601形式で記録されていることを確認
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // affectedSitesが適切に設定されていることを確認
    expect(result.affectedSites).toBeDefined();
    expect(result.affectedSites).toHaveLength(2);
    expect(result.affectedSites?.[0]).toMatchObject({
      siteId: 'site-001',
      riskScore: 75,
      affectedTeamIds: ['team-001', 'team-002'],
    });
    expect(result.affectedSites?.[1]).toMatchObject({
      siteId: 'site-002',
      riskScore: 80,
      affectedTeamIds: ['team-003'],
    });

    // delayRiskDetectedが真であることを確認
    expect(result.delayRiskDetected).toBe(true);

    // placementProposalIdが設定されていることを確認
    expect(result.placementProposalId).toBe('proposal-12345');

    // タイマーをリセット
    jest.useRealTimers();
  });
});