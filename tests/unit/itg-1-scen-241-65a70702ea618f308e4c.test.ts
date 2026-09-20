import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-241: 境界：teamIdsがnullの場合、指定拠点の全チームを対象として集約を実行', () => {
  it('should aggregate data for all teams in specified facility when teamIds is null', async () => {
    const facilityId = 'facility001';
    const teamA = 'teamA';
    const teamB = 'teamB';
    const teamC = 'teamC';
    const startDateTime = '2024-01-01T00:00:00Z';
    const endDateTime = '2024-01-02T00:00:00Z';
    const requestUserId = 'user123';

    const mockProgressData = [
      {
        progressDataId: 'prog001',
        workInstructionId: 'work001',
        facilityId,
        teamId: teamA,
        progressDate: '2024-01-01T12:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: 80,
        delayFlag: false,
        delayDays: null,
      },
      {
        progressDataId: 'prog002',
        workInstructionId: 'work002',
        facilityId,
        teamId: teamB,
        progressDate: '2024-01-01T12:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 75,
        completionRate: 75,
        delayFlag: true,
        delayDays: 1,
      },
      {
        progressDataId: 'prog003',
        workInstructionId: 'work003',
        facilityId,
        teamId: teamC,
        progressDate: '2024-01-01T12:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 90,
        completionRate: 90,
        delayFlag: false,
        delayDays: null,
      },
    ];

    const mockDelayRiskData = [
      {
        riskJudgmentId: 'risk001',
        workInstructionId: 'work001',
        facilityId,
        teamId: teamA,
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        currentProgressRate: 80,
        plannedProgressRate: 85,
        delayReason: '順調',
        recommendedAction: 'なし',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T12:00:00Z',
      },
      {
        riskJudgmentId: 'risk002',
        workInstructionId: 'work002',
        facilityId,
        teamId: teamB,
        riskLevel: 'MEDIUM',
        delayPredictionDays: 1,
        currentProgressRate: 75,
        plannedProgressRate: 85,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '対応中',
        judgmentDateTime: '2024-01-01T12:00:00Z',
      },
      {
        riskJudgmentId: 'risk003',
        workInstructionId: 'work003',
        facilityId,
        teamId: teamC,
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        currentProgressRate: 90,
        plannedProgressRate: 88,
        delayReason: 'なし',
        recommendedAction: 'なし',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T12:00:00Z',
      },
    ];

    const mockAllocationStatus = [
      {
        allocationExecutionStatusId: 'alloc001',
        allocationPlanId: 'plan001',
        workInstructionId: 'work001',
        workerId: 'worker001',
        facilityId,
        teamId: teamA,
        allocationState: '配置中',
        plannedWorkHours: 8,
        actualWorkHours: 7,
        progressRate: 87.5,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: '2024-01-01T08:15:00Z',
        actualEndDateTime: null,
      },
      {
        allocationExecutionStatusId: 'alloc002',
        allocationPlanId: 'plan002',
        workInstructionId: 'work002',
        workerId: 'worker002',
        facilityId,
        teamId: teamB,
        allocationState: '配置中',
        plannedWorkHours: 8,
        actualWorkHours: 6,
        progressRate: 75,
        delayFlag: true,
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: '2024-01-01T09:00:00Z',
        actualEndDateTime: null,
      },
      {
        allocationExecutionStatusId: 'alloc003',
        allocationPlanId: 'plan003',
        workInstructionId: 'work003',
        workerId: 'worker003',
        facilityId,
        teamId: teamC,
        allocationState: '配置完了',
        plannedWorkHours: 8,
        actualWorkHours: 8,
        progressRate: 100,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: '2024-01-01T17:00:00Z',
      },
    ];

    const mockHandyTerminalLog = [
      {
        syncLogId: 'sync001',
        workerId: 'worker001',
        facilityId,
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T12:30:00Z',
        receiveDateTime: '2024-01-01T12:30:05Z',
        processingCompleteDateTime: '2024-01-01T12:30:10Z',
      },
      {
        syncLogId: 'sync002',
        workerId: 'worker002',
        facilityId,
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T13:00:00Z',
        receiveDateTime: '2024-01-01T13:00:05Z',
        processingCompleteDateTime: '2024-01-01T13:00:10Z',
      },
      {
        syncLogId: 'sync003',
        workerId: 'worker003',
        facilityId,
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T14:00:00Z',
        receiveDateTime: '2024-01-01T14:00:05Z',
        processingCompleteDateTime: '2024-01-01T14:00:10Z',
      },
    ];

    const mockImprovementInstructionHistory = [
      {
        deliveryHistoryId: 'deliv001',
        facilityId,
        teamId: teamA,
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-01T13:00:00Z',
        deliveryStatus: '配信済',
        recipientCount: 5,
        acknowledgedCount: 5,
      },
      {
        deliveryHistoryId: 'deliv002',
        facilityId,
        teamId: teamB,
        improvementInstructionContent: '優先順位変更',
        deliveryDateTime: '2024-01-01T13:30:00Z',
        deliveryStatus: '受領確認済',
        recipientCount: 4,
        acknowledgedCount: 3,
      },
      {
        deliveryHistoryId: 'deliv003',
        facilityId,
        teamId: teamC,
        improvementInstructionContent: 'その他',
        deliveryDateTime: '2024-01-01T14:00:00Z',
        deliveryStatus: '配信済',
        recipientCount: 3,
        acknowledgedCount: 2,
      },
    ];

    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listProgressDataByCondition').mockResolvedValue(mockProgressData);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listDelayRiskJudgmentByCondition').mockResolvedValue(mockDelayRiskData);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listAllocationExecutionStatusByCondition').mockResolvedValue(mockAllocationStatus);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listHandyTerminalSyncLogByCondition').mockResolvedValue(mockHandyTerminalLog);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listWorkInstructionReceptionHistoryByCondition').mockResolvedValue(mockImprovementInstructionHistory);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'validateDateTimeRange').mockResolvedValue(true);

    const result = await aggregateDashboardData({
      facilityIds: [facilityId],
      teamIds: null,
      aggregationStartDateTime: startDateTime,
      aggregationEndDateTime: endDateTime,
      requestUserId,
    });

    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(result.progressByFacilityAndTeam.length).toBe(3);
    const teamIds = result.progressByFacilityAndTeam.map((p) => p.teamId);
    expect(teamIds).toContain(teamA);
    expect(teamIds).toContain(teamB);
    expect(teamIds).toContain(teamC);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(result.delayRiskJudgmentResults.length).toBe(3);
    const riskTeamIds = result.delayRiskJudgmentResults.map((r) => r.teamId);
    expect(riskTeamIds).toContain(teamA);
    expect(riskTeamIds).toContain(teamB);
    expect(riskTeamIds).toContain(teamC);

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(result.allocationExecutionStatus.length).toBe(3);
    const allocTeamIds = result.allocationExecutionStatus.map((a) => a.teamId);
    expect(allocTeamIds).toContain(teamA);
    expect(allocTeamIds).toContain(teamB);
    expect(allocTeamIds).toContain(teamC);

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(result.handyTerminalSyncLog.length).toBe(3);

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(result.improvementInstructionDeliveryHistory.length).toBe(3);
    const deliveryTeamIds = result.improvementInstructionDeliveryHistory.map((h) => h.teamId);
    expect(deliveryTeamIds).toContain(teamA);
    expect(deliveryTeamIds).toContain(teamB);
    expect(deliveryTeamIds).toContain(teamC);

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
    expect(() => new Date(result.aggregationTimestamp)).not.toThrow();
    expect(result.aggregationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});