import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-243: 複数チーム指定時の進捗状況比較集約', () => {
  let mockValidateDateTimeRange: jest.Mock;
  let mockListProgressData: jest.Mock;
  let mockListDelayRiskJudgment: jest.Mock;
  let mockListAllocationExecutionStatus: jest.Mock;
  let mockListProductivityData: jest.Mock;
  let mockListHandyTerminalSyncLog: jest.Mock;
  let mockListWorkInstructionReceptionHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateDateTimeRange = jest.fn().mockReturnValue(undefined);
    mockListProgressData = jest.fn().mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-15T09:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 75,
        completionRate: 75,
        delayFlag: false,
        delayDays: null,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        progressDate: '2024-01-15T09:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 82,
        completionRate: 82,
        delayFlag: false,
        delayDays: null,
      },
      {
        progressDataId: 'PD003',
        workInstructionId: 'WI003',
        facilityId: 'F002',
        teamId: 'T003',
        progressDate: '2024-01-15T09:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 68,
        completionRate: 68,
        delayFlag: true,
        delayDays: 1,
      },
    ]);

    mockListDelayRiskJudgment = jest.fn().mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 0.75,
        currentProgressRate: 75,
        plannedProgressRate: 100,
        delayReason: '効率低下',
        recommendedAction: '人員追加',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-15T09:00:00Z',
      },
      {
        riskJudgmentId: 'RJ002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        riskLevel: 'LOW',
        delayPredictionDays: 0.25,
        currentProgressRate: 82,
        plannedProgressRate: 100,
        delayReason: '軽微',
        recommendedAction: '優先順位変更',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-15T09:00:00Z',
      },
      {
        riskJudgmentId: 'RJ003',
        workInstructionId: 'WI003',
        facilityId: 'F002',
        teamId: 'T003',
        riskLevel: 'HIGH',
        delayPredictionDays: 1.5,
        currentProgressRate: 68,
        plannedProgressRate: 100,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '対応中',
        judgmentDateTime: '2024-01-15T09:00:00Z',
      },
    ]);

    mockListAllocationExecutionStatus = jest.fn().mockResolvedValue([
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'WKR001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: '配置中',
        plannedWorkHours: 100,
        actualWorkHours: 75,
        progressRate: 75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: null,
      },
      {
        allocationExecutionStatusId: 'AES002',
        allocationPlanId: 'AP002',
        workInstructionId: 'WI002',
        workerId: 'WKR002',
        facilityId: 'F001',
        teamId: 'T002',
        allocationState: '配置中',
        plannedWorkHours: 100,
        actualWorkHours: 82,
        progressRate: 82,
        delayFlag: false,
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: null,
      },
      {
        allocationExecutionStatusId: 'AES003',
        allocationPlanId: 'AP003',
        workInstructionId: 'WI003',
        workerId: 'WKR003',
        facilityId: 'F002',
        teamId: 'T003',
        allocationState: '配置中',
        plannedWorkHours: 100,
        actualWorkHours: 68,
        progressRate: 68,
        delayFlag: true,
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: null,
      },
    ]);

    mockListProductivityData = jest.fn().mockResolvedValue([
      {
        productivityDataId: 'PRT001',
        workerId: 'WKR001',
        facilityId: 'F001',
        teamId: 'T001',
        workDate: '2024-01-15',
        plannedWorkTime: 100,
        actualWorkTime: 75,
        completedItems: 75,
        productivityRate: 75,
        qualityScore: 95,
        errorCount: 0,
      },
      {
        productivityDataId: 'PRT002',
        workerId: 'WKR002',
        facilityId: 'F001',
        teamId: 'T002',
        workDate: '2024-01-15',
        plannedWorkTime: 100,
        actualWorkTime: 82,
        completedItems: 82,
        productivityRate: 82,
        qualityScore: 98,
        errorCount: 0,
      },
      {
        productivityDataId: 'PRT003',
        workerId: 'WKR003',
        facilityId: 'F002',
        teamId: 'T003',
        workDate: '2024-01-15',
        plannedWorkTime: 100,
        actualWorkTime: 68,
        completedItems: 68,
        productivityRate: 68,
        qualityScore: 85,
        errorCount: 2,
      },
    ]);

    mockListHandyTerminalSyncLog = jest.fn().mockResolvedValue([
      {
        syncLogId: 'SL001',
        workerId: 'WKR001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-15T09:30:00Z',
        receiveDateTime: '2024-01-15T09:30:00Z',
        processingCompleteDateTime: '2024-01-15T09:31:00Z',
      },
    ]);

    mockListWorkInstructionReceptionHistory = jest.fn().mockResolvedValue([
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-15T10:00:00Z',
        deliveryStatus: '配信済',
        recipientCount: 5,
        acknowledgedCount: 4,
      },
    ]);
  });

  it('複数チーム指定時に進捗状況を比較可能な形式で集約してダッシュボード表示用データセットに含める', async () => {
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001', 'T002', 'T003'],
      aggregationStartDateTime: '2024-01-15T09:00:00Z',
      aggregationEndDateTime: '2024-01-15T18:00:00Z',
      requestUserId: 'USR001',
    };

    jest.spyOn(global, 'Date').mockImplementation(
      () => new Date('2024-01-15T12:00:00Z') as any
    );

    const result = await aggregateDashboardData(input);

    expect(result).toBeDefined();
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(result.progressByFacilityAndTeam.length).toBe(3);

    const t001Progress = result.progressByFacilityAndTeam.find(
      (p) => p.teamId === 'T001'
    );
    expect(t001Progress).toBeDefined();
    expect(t001Progress?.completionRate).toBe(75);
    expect(t001Progress?.delayFlag).toBe(false);

    const t002Progress = result.progressByFacilityAndTeam.find(
      (p) => p.teamId === 'T002'
    );
    expect(t002Progress).toBeDefined();
    expect(t002Progress?.completionRate).toBe(82);
    expect(t002Progress?.delayFlag).toBe(false);

    const t003Progress = result.progressByFacilityAndTeam.find(
      (p) => p.teamId === 'T003'
    );
    expect(t003Progress).toBeDefined();
    expect(t003Progress?.completionRate).toBe(68);
    expect(t003Progress?.delayFlag).toBe(true);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBe(3);

    const t001Risk = result.delayRiskJudgmentResults.find(
      (r) => r.teamId === 'T001'
    );
    expect(t001Risk?.riskLevel).toBe('MEDIUM');

    const t002Risk = result.delayRiskJudgmentResults.find(
      (r) => r.teamId === 'T002'
    );
    expect(t002Risk?.riskLevel).toBe('LOW');

    const t003Risk = result.delayRiskJudgmentResults.find(
      (r) => r.teamId === 'T003'
    );
    expect(t003Risk?.riskLevel).toBe('HIGH');

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.allocationExecutionStatus.length).toBe(3);

    const t001Allocation = result.allocationExecutionStatus.find(
      (a) => a.teamId === 'T001'
    );
    expect(t001Allocation?.plannedWorkHours).toBe(100);
    expect(t001Allocation?.actualWorkHours).toBe(75);
    expect(t001Allocation?.progressRate).toBe(75);
    expect(t001Allocation?.delayFlag).toBe(false);

    const t002Allocation = result.allocationExecutionStatus.find(
      (a) => a.teamId === 'T002'
    );
    expect(t002Allocation?.plannedWorkHours).toBe(100);
    expect(t002Allocation?.actualWorkHours).toBe(82);
    expect(t002Allocation?.progressRate).toBe(82);

    const t003Allocation = result.allocationExecutionStatus.find(
      (a) => a.teamId === 'T003'
    );
    expect(t003Allocation?.plannedWorkHours).toBe(100);
    expect(t003Allocation?.actualWorkHours).toBe(68);
    expect(t003Allocation?.progressRate).toBe(68);
    expect(t003Allocation?.delayFlag).toBe(true);

    const completionRates = result.progressByFacilityAndTeam.map(
      (p) => p.completionRate
    );
    const maxCompletion = Math.max(...completionRates);
    const minCompletion = Math.min(...completionRates);
    expect(maxCompletion - minCompletion).toBe(14);

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(
      true
    );

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.aggregationTimestamp)).toBe(true);
  });
});