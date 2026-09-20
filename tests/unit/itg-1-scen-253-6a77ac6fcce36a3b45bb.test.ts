import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-253: Dashboard Data Aggregation - Empty Progress Data Warning', () => {
  let warnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let listProgressDataByConditionSpy: jest.SpyInstance;
  let listDelayRiskJudgmentByConditionSpy: jest.SpyInstance;
  let listAllocationExecutionStatusByConditionSpy: jest.SpyInstance;
  let listProductivityDataByConditionSpy: jest.SpyInstance;
  let listHandyTerminalSyncLogByConditionSpy: jest.SpyInstance;
  let listImprovementInstructionDeliveryHistoryByConditionSpy: jest.SpyInstance;
  let validateDateTimeRangeSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    listProgressDataByConditionSpy = jest
      .spyOn(dashboardAggregation, 'listProgressDataByCondition' as any)
      .mockResolvedValue([]);

    listDelayRiskJudgmentByConditionSpy = jest
      .spyOn(dashboardAggregation, 'listDelayRiskJudgmentByCondition' as any)
      .mockResolvedValue([
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'F001',
          teamId: 'team-001',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 60,
          delayReason: '人員不足',
          recommendedAction: '人員追加',
          actionStatus: '未対応',
          judgmentDateTime: '2024-01-15T10:00:00Z',
        },
      ]);

    listAllocationExecutionStatusByConditionSpy = jest
      .spyOn(dashboardAggregation, 'listAllocationExecutionStatusByCondition' as any)
      .mockResolvedValue([
        {
          allocationExecutionStatusId: 'alloc-001',
          allocationPlanId: 'plan-001',
          workInstructionId: 'work-001',
          workerId: 'worker-001',
          facilityId: 'F001',
          teamId: 'team-001',
          allocationState: '配置中',
          plannedWorkHours: 40,
          actualWorkHours: 35,
          progressRate: 50,
          delayFlag: false,
          plannedStartDateTime: '2024-01-01T08:00:00Z',
          plannedEndDateTime: '2024-01-31T17:00:00Z',
          actualStartDateTime: '2024-01-01T08:00:00Z',
          actualEndDateTime: null,
        },
      ]);

    listProductivityDataByConditionSpy = jest
      .spyOn(dashboardAggregation, 'listProductivityDataByCondition' as any)
      .mockResolvedValue([]);

    listHandyTerminalSyncLogByConditionSpy = jest
      .spyOn(dashboardAggregation, 'listHandyTerminalSyncLogByCondition' as any)
      .mockResolvedValue([
        {
          syncLogId: 'sync-001',
          workerId: 'worker-001',
          facilityId: 'F001',
          syncType: '作業実績',
          syncStatus: '成功',
          errorMessage: null,
          sendDateTime: '2024-01-15T09:00:00Z',
          receiveDateTime: '2024-01-15T09:00:00Z',
          processingCompleteDateTime: '2024-01-15T09:01:00Z',
        },
      ]);

    listImprovementInstructionDeliveryHistoryByConditionSpy = jest
      .spyOn(dashboardAggregation, 'listImprovementInstructionDeliveryHistoryByCondition' as any)
      .mockResolvedValue([
        {
          deliveryHistoryId: 'delivery-001',
          facilityId: 'F001',
          teamId: 'team-001',
          improvementInstructionContent: '人員追加',
          deliveryDateTime: '2024-01-15T10:00:00Z',
          deliveryStatus: '配信済',
          recipientCount: 5,
          acknowledgedCount: 5,
        },
      ]);

    validateDateTimeRangeSpy = jest
      .spyOn(dashboardAggregation, 'validateDateTimeRange' as any)
      .mockReturnValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
    warnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    listProgressDataByConditionSpy.mockRestore();
    listDelayRiskJudgmentByConditionSpy.mockRestore();
    listAllocationExecutionStatusByConditionSpy.mockRestore();
    listProductivityDataByConditionSpy.mockRestore();
    listHandyTerminalSyncLogByConditionSpy.mockRestore();
    listImprovementInstructionDeliveryHistoryByConditionSpy.mockRestore();
    validateDateTimeRangeSpy.mockRestore();
  });

  it('should emit warn log and return partial aggregation when progress data is empty', async () => {
    // Arrange
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user-123',
    };

    // Act
    const result = await aggregateDashboardData(input);

    // Assert
    // (1) ログレベルがwarnで、メッセージが記録されている
    expect(warnSpy).toHaveBeenCalledWith(
      '進捗データが取得できていません。判定精度が低下します'
    );

    // (2) 出力型が返され、progressByFacilityAndTeamは空配列
    expect(result).toBeDefined();
    expect(result.progressByFacilityAndTeam).toEqual([]);
    expect(result.progressByFacilityAndTeam).toHaveLength(0);

    // (3) 他のデータはスタブから返された正常なデータを含む
    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    expect(result.delayRiskJudgmentResults[0]).toHaveProperty('riskJudgmentId');
    expect(result.delayRiskJudgmentResults[0]).toHaveProperty('riskLevel');

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.allocationExecutionStatus.length).toBeGreaterThan(0);
    expect(result.allocationExecutionStatus[0]).toHaveProperty('allocationExecutionStatusId');

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(result.handyTerminalSyncLog.length).toBeGreaterThan(0);
    expect(result.handyTerminalSyncLog[0]).toHaveProperty('syncLogId');

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory.length).toBeGreaterThan(0);
    expect(result.improvementInstructionDeliveryHistory[0]).toHaveProperty('deliveryHistoryId');
    expect(result.improvementInstructionDeliveryHistory[0]).toHaveProperty('improvementInstructionContent');

    // (4) aggregationTimestampはISO 8601形式
    expect(result.aggregationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );

    // (5) 設計済みエラーが発生していない
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // Verify that stubs were called with expected parameters
    expect(listProgressDataByConditionSpy).toHaveBeenCalled();
    expect(listDelayRiskJudgmentByConditionSpy).toHaveBeenCalled();
    expect(listAllocationExecutionStatusByConditionSpy).toHaveBeenCalled();
    expect(listProductivityDataByConditionSpy).toHaveBeenCalled();
    expect(listHandyTerminalSyncLogByConditionSpy).toHaveBeenCalled();
    expect(listImprovementInstructionDeliveryHistoryByConditionSpy).toHaveBeenCalled();
    expect(validateDateTimeRangeSpy).toHaveBeenCalled();
  });
});