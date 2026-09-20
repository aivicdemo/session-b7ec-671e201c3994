import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-267: aggregateDashboardDataの出力に改善指示配信履歴が含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('improvementInstructionDeliveryHistoryに改善指示配信履歴配列が含まれる', async () => {
    // Arrange: モックデータの準備
    const mockProgressData = [
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-15T00:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 60,
        completionRate: 60,
        delayFlag: false,
        delayDays: null,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        progressDate: '2024-01-15T00:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 70,
        completionRate: 70,
        delayFlag: false,
        delayDays: null,
      },
    ];

    const mockDelayRiskData = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 2,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-15T09:00:00Z',
      },
      {
        riskJudgmentId: 'RJ002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        currentProgressRate: 70,
        plannedProgressRate: 80,
        delayReason: '効率低下',
        recommendedAction: '優先順位変更',
        actionStatus: '対応中',
        judgmentDateTime: '2024-01-15T09:00:00Z',
      },
    ];

    const mockAllocationExecutionStatus = [
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: '配置中',
        plannedWorkHours: 40,
        actualWorkHours: 32,
        progressRate: 80,
        delayFlag: false,
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-16T17:00:00Z',
        actualStartDateTime: '2024-01-15T08:30:00Z',
        actualEndDateTime: null,
      },
    ];

    const mockProductivityData = [
      {
        productivityDataId: 'PROD001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workDate: '2024-01-15T00:00:00Z',
        plannedWorkTime: 480,
        actualWorkTime: 400,
        completedQuantity: 50,
        productivityRate: 95,
      },
    ];

    const mockHandyTerminalSyncLog = [
      {
        syncLogId: 'SL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-15T12:00:00Z',
        receiveDateTime: '2024-01-15T12:00:05Z',
        processingCompleteDateTime: '2024-01-15T12:00:10Z',
      },
    ];

    const mockImprovementInstructionDeliveryHistory = [
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: '人員追加対応',
        deliveryDateTime: '2024-01-15T09:30:00Z',
        deliveryStatus: '配信完了',
        recipientCount: 5,
        acknowledgedCount: 5,
      },
      {
        deliveryHistoryId: 'DH002',
        facilityId: 'F001',
        teamId: 'T002',
        improvementInstructionContent: '優先順位変更',
        deliveryDateTime: '2024-01-20T14:15:00Z',
        deliveryStatus: '配信完了',
        recipientCount: 4,
        acknowledgedCount: 4,
      },
      {
        deliveryHistoryId: 'DH003',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: '作業難度調整',
        deliveryDateTime: '2024-01-25T11:00:00Z',
        deliveryStatus: '受信確認待機中',
        recipientCount: 5,
        acknowledgedCount: 3,
      },
    ];

    // スタブ処理の設定
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition').mockResolvedValue(mockProgressData);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition').mockResolvedValue(mockDelayRiskData);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition').mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition').mockResolvedValue(mockProductivityData);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition').mockResolvedValue(mockHandyTerminalSyncLog);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition').mockResolvedValue(mockImprovementInstructionDeliveryHistory);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange').mockReturnValue(true);

    // Act: aggregateDashboardData関数を呼び出す
    const input = {
      facilityIds: ['F001'],
      teamIds: ['T001', 'T002'],
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user123',
    };

    const result = await aggregateDashboardData(input);

    // Assert: improvementInstructionDeliveryHistoryを検証
    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory.length).toBeGreaterThanOrEqual(3);

    // 最初の要素を検証
    expect(result.improvementInstructionDeliveryHistory[0]).toEqual({
      deliveryHistoryId: 'DH001',
      facilityId: 'F001',
      teamId: 'T001',
      improvementInstructionContent: '人員追加対応',
      deliveryDateTime: '2024-01-15T09:30:00Z',
      deliveryStatus: '配信完了',
      recipientCount: 5,
      acknowledgedCount: 5,
    });

    // 2番目の要素を検証
    expect(result.improvementInstructionDeliveryHistory[1]).toEqual({
      deliveryHistoryId: 'DH002',
      facilityId: 'F001',
      teamId: 'T002',
      improvementInstructionContent: '優先順位変更',
      deliveryDateTime: '2024-01-20T14:15:00Z',
      deliveryStatus: '配信完了',
      recipientCount: 4,
      acknowledgedCount: 4,
    });

    // 3番目の要素を検証
    expect(result.improvementInstructionDeliveryHistory[2]).toEqual({
      deliveryHistoryId: 'DH003',
      facilityId: 'F001',
      teamId: 'T001',
      improvementInstructionContent: '作業難度調整',
      deliveryDateTime: '2024-01-25T11:00:00Z',
      deliveryStatus: '受信確認待機中',
      recipientCount: 5,
      acknowledgedCount: 3,
    });

    // その他のフィールドが正常に格納されていることを確認
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
  });
});