import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-244: 拠点別・チーム別進捗集約ダッシュボードデータ生成', () => {
  it('複数チームの進捗状況を代表値で集約し、完了率・遅延フラグ・遅延日数が設計どおり計算される', async () => {
    // Arrange
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001', 'T002', 'T003'],
      aggregationStartDateTime: '2024-01-15T08:00:00Z',
      aggregationEndDateTime: '2024-01-15T18:00:00Z',
      requestUserId: 'USER001',
    };

    // スタブ: validateDateTimeRange
    jest.spyOn(dashboardAggregation, 'validateDateTimeRange' as any).mockReturnValue(true);

    // スタブ: listProgressDataByCondition
    jest.spyOn(dashboardAggregation, 'listProgressDataByCondition' as any).mockResolvedValue([
      { teamId: 'T001', ordersReceived: 100, ordersCompleted: 80 },
      { teamId: 'T002', ordersReceived: 120, ordersCompleted: 90 },
      { teamId: 'T003', ordersReceived: 80, ordersCompleted: 80 },
    ]);

    // スタブ: listDelayRiskJudgmentByCondition
    jest.spyOn(dashboardAggregation, 'listDelayRiskJudgmentByCondition' as any).mockResolvedValue([
      { teamId: 'T001', riskLevel: 'LOW', estimatedDelayMinutes: -10 },
      { teamId: 'T002', riskLevel: 'MEDIUM', estimatedDelayMinutes: 45 },
      { teamId: 'T003', riskLevel: 'LOW', estimatedDelayMinutes: -5 },
    ]);

    // スタブ: listAllocationExecutionStatusByCondition
    jest.spyOn(dashboardAggregation, 'listAllocationExecutionStatusByCondition' as any).mockResolvedValue([
      { teamId: 'T001', state: 'executed', plannedWorkload: 800, actualWorkload: 760, rate: 95, delayed: false },
      { teamId: 'T002', state: 'executed', plannedWorkload: 960, actualWorkload: 920, rate: 92, delayed: true },
      { teamId: 'T003', state: 'executed', plannedWorkload: 640, actualWorkload: 640, rate: 100, delayed: false },
    ]);

    // スタブ: listProductivityDataByCondition
    jest.spyOn(dashboardAggregation, 'listProductivityDataByCondition' as any).mockResolvedValue([]);

    // スタブ: listHandyTerminalSyncLogByCondition
    jest.spyOn(dashboardAggregation, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([
      { timestamp: '2024-01-15T18:00:00Z', status: 'success', failures: 0 },
    ]);

    // スタブ: listWorkInstructionReceptionHistoryByCondition
    jest.spyOn(dashboardAggregation, 'listWorkInstructionReceptionHistoryByCondition' as any).mockResolvedValue([
      { when: '2024-01-15T12:30:00Z', to: 'T002', what: '人員追加', how: 'completed' },
    ]);

    // Act
    const result = await aggregateDashboardData(input);

    // Assert - progressByFacilityAndTeam validation
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(result.progressByFacilityAndTeam.length).toBe(3);

    const t001Progress = result.progressByFacilityAndTeam.find(
      (p) => p.teamId === 'T001'
    );
    expect(t001Progress).toBeDefined();
    expect(t001Progress!.completionRate).toBe(80);
    expect(t001Progress!.delayFlag).toBe(false);
    expect(t001Progress!.delayDays).toBe(-10);

    const t002Progress = result.progressByFacilityAndTeam.find(
      (p) => p.teamId === 'T002'
    );
    expect(t002Progress).toBeDefined();
    expect(t002Progress!.completionRate).toBe(75);
    expect(t002Progress!.delayFlag).toBe(true);
    expect(t002Progress!.delayDays).toBe(45);

    const t003Progress = result.progressByFacilityAndTeam.find(
      (p) => p.teamId === 'T003'
    );
    expect(t003Progress).toBeDefined();
    expect(t003Progress!.completionRate).toBe(100);
    expect(t003Progress!.delayFlag).toBe(false);
    expect(t003Progress!.delayDays).toBe(-5);

    // Assert - delayRiskJudgmentResults validation
    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    const t002RiskResult = result.delayRiskJudgmentResults.find(
      (r) => r.teamId === 'T002'
    );
    expect(t002RiskResult).toBeDefined();
    expect(t002RiskResult!.riskLevel).toBe('MEDIUM');

    // Assert - allocationExecutionStatus validation
    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.allocationExecutionStatus.length).toBe(3);

    const t001Allocation = result.allocationExecutionStatus.find(
      (a) => a.teamId === 'T001'
    );
    expect(t001Allocation).toBeDefined();
    expect(t001Allocation!.plannedWorkHours).toBe(800);
    expect(t001Allocation!.actualWorkHours).toBe(760);
    expect(t001Allocation!.progressRate).toBe(95);
    expect(t001Allocation!.delayFlag).toBe(false);

    const t002Allocation = result.allocationExecutionStatus.find(
      (a) => a.teamId === 'T002'
    );
    expect(t002Allocation).toBeDefined();
    expect(t002Allocation!.plannedWorkHours).toBe(960);
    expect(t002Allocation!.actualWorkHours).toBe(920);
    expect(t002Allocation!.progressRate).toBe(92);
    expect(t002Allocation!.delayFlag).toBe(true);

    const t003Allocation = result.allocationExecutionStatus.find(
      (a) => a.teamId === 'T003'
    );
    expect(t003Allocation).toBeDefined();
    expect(t003Allocation!.plannedWorkHours).toBe(640);
    expect(t003Allocation!.actualWorkHours).toBe(640);
    expect(t003Allocation!.progressRate).toBe(100);
    expect(t003Allocation!.delayFlag).toBe(false);

    // Assert - handyTerminalSyncLog validation
    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(result.handyTerminalSyncLog.length).toBeGreaterThan(0);

    const syncLog = result.handyTerminalSyncLog[0];
    expect(syncLog.syncStatus).toBe('success');
    expect(syncLog.errorMessage).toBeNull();
    expect(syncLog.processingCompleteDateTime).toBeDefined();

    // Assert - improvementInstructionDeliveryHistory validation
    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory.length).toBeGreaterThan(0);

    const deliveryHistory = result.improvementInstructionDeliveryHistory.find(
      (h) => h.teamId === 'T002'
    );
    expect(deliveryHistory).toBeDefined();
    expect(deliveryHistory!.deliveryDateTime).toBe('2024-01-15T12:30:00Z');
    expect(deliveryHistory!.improvementInstructionContent).toBe('人員追加');
    expect(deliveryHistory!.deliveryStatus).toBe('completed');

    // Assert - aggregationTimestamp validation
    expect(result.aggregationTimestamp).toBeDefined();
    expect(result.aggregationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});