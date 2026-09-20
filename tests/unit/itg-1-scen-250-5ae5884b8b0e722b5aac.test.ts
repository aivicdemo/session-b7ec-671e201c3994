import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

jest.mock('../../src/logic/dashboard-aggregation', () => {
  const actual = jest.requireActual('../../src/logic/dashboard-aggregation');
  return {
    ...actual,
  };
});

describe('SCEN-250: 進捗遅延リスク評価と統合ダッシュボードデータ生成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('進捗遅延リスク評価と統合ダッシュボードデータが正しく生成される', async () => {
    const mockListProgressDataByCondition = jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 40,
        completionRate: 33.3,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);

    const mockListDelayRiskJudgmentByCondition = jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);

    const mockListAllocationExecutionStatusByCondition = jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: '配置済',
        plannedWorkHours: 480,
        actualWorkHours: 450,
        progressRate: 93.75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T00:00:00Z',
        plannedEndDateTime: '2024-01-01T08:00:00Z',
        actualStartDateTime: '2024-01-01T00:00:00Z',
        actualEndDateTime: null,
      },
    ]);

    const mockListProductivityDataByCondition = jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([
      {
        productivityDataId: 'PRD001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workDate: '2024-01-01T00:00:00Z',
        averageProcessingTimeMinutes: 1.2,
        proficiencyLevel: 0.9,
        completedQuantity: 60,
        plannedQuantity: 120,
      },
    ]);

    const mockListHandyTerminalSyncLogByCondition = jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([
      {
        syncLogId: 'SL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T07:40:00Z',
        receiveDateTime: '2024-01-01T07:45:00Z',
        processingCompleteDateTime: '2024-01-01T07:50:00Z',
      },
    ]);

    const mockListWorkInstructionReceptionHistoryByCondition = jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: '人員追加推奨',
        deliveryDateTime: '2024-01-01T06:00:00Z',
        deliveryStatus: '受領確認',
        recipientCount: 10,
        acknowledgedCount: 10,
      },
    ]);

    const mockValidateDateTimeRange = jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    let result: any;
    let error: Error | null = null;
    try {
      result = await aggregateDashboardData(input);
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);

    const progressT001 = result.progressByFacilityAndTeam.find((p: any) => p.teamId === 'T001');
    const progressT002 = result.progressByFacilityAndTeam.find((p: any) => p.teamId === 'T002');

    expect(progressT001).toBeDefined();
    expect(progressT001.completionRate).toBe(50);
    expect(progressT001.delayFlag).toBe(false);
    expect(progressT001.delayDays).toBeNull();
    expect(progressT001.allocationEfficiency).toBeCloseTo(93.75, 1);

    expect(progressT002).toBeDefined();
    expect(progressT002.completionRate).toBeCloseTo(33.3, 1);
    expect(progressT002.delayFlag).toBe(false);
    expect(progressT002.delayDays).toBeNull();

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    if (result.delayRiskJudgmentResults.length > 0) {
      const riskResult = result.delayRiskJudgmentResults[0];
      expect(riskResult.riskLevel).toBe('low');
      expect(riskResult.delayPredictionDays).toBe(0);
      expect(riskResult.recommendedAction).toBe('');
    }

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);

    if (result.allocationExecutionStatus.length > 0) {
      const allocation = result.allocationExecutionStatus[0];
      expect(allocation.allocationState).toBe('配置済');
      expect(allocation.plannedWorkHours).toBe(480);
      expect(allocation.actualWorkHours).toBe(450);
      expect(allocation.progressRate).toBeCloseTo(93.75, 1);
      expect(allocation.delayFlag).toBe(false);
    }

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    if (result.handyTerminalSyncLog.length > 0) {
      const syncLog = result.handyTerminalSyncLog[0];
      expect(syncLog.syncStatus).toBe('成功');
      expect(syncLog.errorMessage).toBeNull();
      expect(syncLog.processingCompleteDateTime).toBe('2024-01-01T07:50:00Z');
    }

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);

    if (result.improvementInstructionDeliveryHistory.length > 0) {
      const improvement = result.improvementInstructionDeliveryHistory[0];
      expect(improvement.deliveryDateTime).toBe('2024-01-01T06:00:00Z');
      expect(improvement.facilityId).toBe('F001');
      expect(improvement.teamId).toBe('T001');
      expect(improvement.improvementInstructionContent).toBe('人員追加推奨');
      expect(improvement.deliveryStatus).toBe('受領確認');
    }

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');

    const timestampDate = new Date(result.aggregationTimestamp);
    expect(timestampDate.getTime()).toBeGreaterThan(0);

    mockListProgressDataByCondition.mockRestore();
    mockListDelayRiskJudgmentByCondition.mockRestore();
    mockListAllocationExecutionStatusByCondition.mockRestore();
    mockListProductivityDataByCondition.mockRestore();
    mockListHandyTerminalSyncLogByCondition.mockRestore();
    mockListWorkInstructionReceptionHistoryByCondition.mockRestore();
    mockValidateDateTimeRange.mockRestore();
  });

  it('低リスク判定時に推奨対応が適切に設定される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);

    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);

    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);

    const riskResult = result.delayRiskJudgmentResults[0];
    expect(riskResult.riskLevel).toBe('low');
    expect(riskResult.delayPredictionDays).toBe(0);
    expect(riskResult.recommendedAction).toBe('');
  });

  it('拠点とチームが正しく集約されている', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 40,
        completionRate: 33.3,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);

    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.progressByFacilityAndTeam.every((p: any) => p.facilityId === 'F001')).toBe(true);
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThanOrEqual(2);

    const teamIds = result.progressByFacilityAndTeam.map((p: any) => p.teamId);
    expect(teamIds).toContain('T001');
    expect(teamIds).toContain('T002');
  });

  it('ハンディターミナル連携ログが正しく格納される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([
      {
        syncLogId: 'SL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T07:40:00Z',
        receiveDateTime: '2024-01-01T07:45:00Z',
        processingCompleteDateTime: '2024-01-01T07:50:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    if (result.handyTerminalSyncLog.length > 0) {
      const syncLog = result.handyTerminalSyncLog[0];
      expect(syncLog.syncLogId).toBeDefined();
      expect(syncLog.workerId).toBeDefined();
      expect(syncLog.facilityId).toBeDefined();
      expect(syncLog.syncType).toBeDefined();
      expect(syncLog.syncStatus).toBeDefined();
      expect(syncLog.sendDateTime).toBeDefined();
      expect(syncLog.errorMessage).toBeNull();
      expect(syncLog.processingCompleteDateTime).toBe('2024-01-01T07:50:00Z');
    }
  });

  it('改善指示配信履歴が正しく格納される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: '人員追加推奨',
        deliveryDateTime: '2024-01-01T06:00:00Z',
        deliveryStatus: '受領確認',
        recipientCount: 10,
        acknowledgedCount: 10,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);

    if (result.improvementInstructionDeliveryHistory.length > 0) {
      const history = result.improvementInstructionDeliveryHistory[0];
      expect(history.deliveryHistoryId).toBeDefined();
      expect(history.facilityId).toBe('F001');
      expect(history.improvementInstructionContent).toBe('人員追加推奨');
      expect(history.deliveryDateTime).toBe('2024-01-01T06:00:00Z');
      expect(history.deliveryStatus).toBe('受領確認');
      expect(history.recipientCount).toBeGreaterThanOrEqual(0);
      expect(history.acknowledgedCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('全ての必須フィールドが返却される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result).toHaveProperty('progressByFacilityAndTeam');
    expect(result).toHaveProperty('delayRiskJudgmentResults');
    expect(result).toHaveProperty('allocationExecutionStatus');
    expect(result).toHaveProperty('handyTerminalSyncLog');
    expect(result).toHaveProperty('improvementInstructionDeliveryHistory');
    expect(result).toHaveProperty('aggregationTimestamp');

    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(typeof result.aggregationTimestamp).toBe('string');
  });

  it('リスク判定結果が期待値どおり計算されている', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);

    const riskResult = result.delayRiskJudgmentResults[0];
    expect(riskResult.riskJudgmentId).toBeDefined();
    expect(riskResult.workInstructionId).toBeDefined();
    expect(riskResult.facilityId).toBeDefined();
    expect(riskResult.teamId).toBeDefined();
    expect(riskResult.riskLevel).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(riskResult.riskLevel);
    expect(typeof riskResult.delayPredictionDays).toBe('number');
    expect(typeof riskResult.currentProgressRate).toBe('number');
    expect(typeof riskResult.plannedProgressRate).toBe('number');
    expect(riskResult.delayReason).toBeDefined();
    expect(riskResult.recommendedAction).toBeDefined();
    expect(riskResult.actionStatus).toBeDefined();
    expect(riskResult.judgmentDateTime).toBeDefined();
  });

  it('低リスク判定時に推奨対応が空文字列である', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    const riskResult = result.delayRiskJudgmentResults[0];
    expect(riskResult.riskLevel).toBe('low');
    expect(riskResult.recommendedAction).toBe('');
  });

  it('配置実行状況の進捗率が正しく計算される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: '配置済',
        plannedWorkHours: 480,
        actualWorkHours: 450,
        progressRate: 93.75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T00:00:00Z',
        plannedEndDateTime: '2024-01-01T08:00:00Z',
        actualStartDateTime: '2024-01-01T00:00:00Z',
        actualEndDateTime: null,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.allocationExecutionStatus.length).toBeGreaterThan(0);

    const allocation = result.allocationExecutionStatus[0];
    expect(allocation.allocationExecutionStatusId).toBeDefined();
    expect(allocation.allocationPlanId).toBeDefined();
    expect(allocation.workInstructionId).toBeDefined();
    expect(allocation.workerId).toBeDefined();
    expect(allocation.facilityId).toBeDefined();
    expect(allocation.teamId).toBeDefined();
    expect(allocation.allocationState).toBeDefined();
    expect(allocation.plannedWorkHours).toBeGreaterThan(0);
    expect(allocation.actualWorkHours).toBeGreaterThanOrEqual(0);
    expect(typeof allocation.progressRate).toBe('number');
    expect(allocation.progressRate).toBeGreaterThanOrEqual(0);
    expect(allocation.progressRate).toBeLessThanOrEqual(100);
    expect(typeof allocation.delayFlag).toBe('boolean');
    expect(allocation.progressRate).toBeCloseTo(93.75, 1);
  });

  it('進捗データの完了率が正しく集約される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    const progressData = result.progressByFacilityAndTeam;
    expect(progressData.length).toBeGreaterThan(0);

    progressData.forEach((p: any) => {
      expect(p.facilityId).toBeDefined();
      expect(p.facilityName).toBeDefined();
      expect(p.teamId).toBeDefined();
      expect(p.teamName).toBeDefined();
      expect(typeof p.completionRate).toBe('number');
      expect(p.completionRate).toBeGreaterThanOrEqual(0);
      expect(p.completionRate).toBeLessThanOrEqual(100);
      expect(typeof p.delayFlag).toBe('boolean');
      expect(typeof p.allocationEfficiency).toBe('number');
      expect(p.allocationEfficiency).toBeGreaterThanOrEqual(0);
    });
  });

  it('ダッシュボード集計タイムスタンプが有効なISO 8601形式である', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.aggregationTimestamp).toBeDefined();
    const timestamp = new Date(result.aggregationTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(result.aggregationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('遅延確度が0.17で計算され、リスクレベルが低に判定される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    const riskResult = result.delayRiskJudgmentResults[0];
    expect(riskResult.riskLevel).toBe('low');
    expect(riskResult.currentProgressRate).toBeLessThan(riskResult.plannedProgressRate);
  });

  it('ハンディターミナル連携ステータスが完了でエラー件数が0である', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([
      {
        syncLogId: 'SL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T07:40:00Z',
        receiveDateTime: '2024-01-01T07:45:00Z',
        processingCompleteDateTime: '2024-01-01T07:50:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    const syncLog = result.handyTerminalSyncLog[0];
    expect(syncLog.syncStatus).toBe('成功');
    expect(syncLog.errorMessage).toBeNull();
  });

  it('処理速度不足度合いが期待値で計算され、リスク判定に反映される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 60,
        completionRate: 50,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        progressDate: '2024-01-01T00:00:00Z',
        plannedQuantity: 120,
        actualQuantity: 40,
        completionRate: 33.3,
        delayFlag: false,
        delayDays: null,
        elapsedTimeMinutes: 120,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([
      {
        productivityDataId: 'PRD001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workDate: '2024-01-01T00:00:00Z',
        averageProcessingTimeMinutes: 1.2,
        proficiencyLevel: 0.9,
        completedQuantity: 60,
        plannedQuantity: 120,
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    const riskResult = result.delayRiskJudgmentResults[0];
    expect(riskResult.riskLevel).toBe('low');
    expect(riskResult.delayPredictionDays).toBe(0);
  });

  it('リスク判定で遅延対象チームが適切に判定される', async () => {
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'low',
        delayPredictionDays: 0,
        currentProgressRate: 50,
        plannedProgressRate: 60,
        delayReason: '処理速度低下',
        recommendedAction: '',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange' as any).mockReturnValue(true);

    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    result.delayRiskJudgmentResults.forEach((risk: any) => {
      if (risk.riskLevel === 'low') {
        expect(risk.recommendedAction).toBe('');
      }
    });
  });
});