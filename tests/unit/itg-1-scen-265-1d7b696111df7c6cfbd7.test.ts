import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import type {
  AggregateDashboardDataInput,
  AggregateDashboardDataOutput,
  AllocationExecutionStatusData,
  ProgressByFacilityAndTeamData,
  DelayRiskJudgmentResultData,
  HandyTerminalSyncLogData,
  ImprovementInstructionDeliveryHistoryData,
} from '../../src/logic/dashboard-aggregation';

describe('aggregateDashboardData - allocationExecutionStatus output', () => {
  let mockListProgressDataByCondition: jest.Mock;
  let mockListDelayRiskJudgmentByCondition: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockListWorkInstructionReceptionHistoryByCondition: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;

  beforeEach(() => {
    mockValidateDateTimeRange = jest.fn().mockReturnValue(true);
    mockListProgressDataByCondition = jest.fn();
    mockListDelayRiskJudgmentByCondition = jest.fn();
    mockListAllocationExecutionStatusByCondition = jest.fn();
    mockListProductivityDataByCondition = jest.fn();
    mockListHandyTerminalSyncLogByCondition = jest.fn();
    mockListWorkInstructionReceptionHistoryByCondition = jest.fn();

    jest.doMock('../../src/logic/dashboard-aggregation', () => ({
      aggregateDashboardData: aggregateDashboardData,
      validateDateTimeRange: mockValidateDateTimeRange,
      listProgressDataByCondition: mockListProgressDataByCondition,
      listDelayRiskJudgmentByCondition: mockListDelayRiskJudgmentByCondition,
      listAllocationExecutionStatusByCondition: mockListAllocationExecutionStatusByCondition,
      listProductivityDataByCondition: mockListProductivityDataByCondition,
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
      listWorkInstructionReceptionHistoryByCondition: mockListWorkInstructionReceptionHistoryByCondition,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should return allocationExecutionStatus as an array of AllocationExecutionStatusData with valid structure', async () => {
    const mockAllocationExecutionStatusData: AllocationExecutionStatusData[] = [
      {
        allocationExecutionStatusId: 'ALLOC001',
        allocationPlanId: 'PLAN001',
        workInstructionId: 'WORK001',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        allocationState: 'active',
        plannedWorkHours: 40,
        actualWorkHours: 35,
        progressRate: 87,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: '2024-01-01T08:15:00Z',
        actualEndDateTime: null,
      },
      {
        allocationExecutionStatusId: 'ALLOC002',
        allocationPlanId: 'PLAN002',
        workInstructionId: 'WORK002',
        workerId: 'WORKER002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        allocationState: 'standby',
        plannedWorkHours: 40,
        actualWorkHours: 0,
        progressRate: 0,
        delayFlag: true,
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
      },
    ];

    const mockProgressData: ProgressByFacilityAndTeamData[] = [
      {
        facilityId: 'FAC001',
        facilityName: '東京拠点',
        teamId: 'TEAM001',
        teamName: 'チームA',
        completionRate: 85,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 87,
      },
    ];

    const mockDelayRiskData: DelayRiskJudgmentResultData[] = [
      {
        riskJudgmentId: 'RISK001',
        workInstructionId: 'WORK001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        currentProgressRate: 85,
        plannedProgressRate: 80,
        delayReason: '進捗順調',
        recommendedAction: '継続監視',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T10:00:00Z',
      },
    ];

    const mockHandyTerminalSyncLog: HandyTerminalSyncLogData[] = [
      {
        syncLogId: 'SYNC001',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T09:00:00Z',
        receiveDateTime: '2024-01-01T09:01:00Z',
        processingCompleteDateTime: '2024-01-01T09:02:00Z',
      },
    ];

    const mockDeliveryHistory: ImprovementInstructionDeliveryHistoryData[] = [
      {
        deliveryHistoryId: 'DEL001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-01T08:00:00Z',
        deliveryStatus: '配信済',
        recipientCount: 10,
        acknowledgedCount: 8,
      },
    ];

    mockListProgressDataByCondition.mockResolvedValue(mockProgressData);
    mockListDelayRiskJudgmentByCondition.mockResolvedValue(mockDelayRiskData);
    mockListAllocationExecutionStatusByCondition.mockResolvedValue(mockAllocationExecutionStatusData);
    mockListProductivityDataByCondition.mockResolvedValue([]);
    mockListHandyTerminalSyncLogByCondition.mockResolvedValue(mockHandyTerminalSyncLog);
    mockListWorkInstructionReceptionHistoryByCondition.mockResolvedValue(mockDeliveryHistory);
    mockValidateDateTimeRange.mockReturnValue(true);

    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.allocationExecutionStatus.length).toBeGreaterThanOrEqual(1);

    result.allocationExecutionStatus.forEach((item) => {
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(item.allocationPlanId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(item.teamId).toBeDefined();

      expect(['active', 'standby', 'completed', '配置予定', '配置中', '配置完了']).toContain(
        item.allocationState
      );

      expect(typeof item.plannedWorkHours).toBe('number');
      expect(item.plannedWorkHours).toBeGreaterThanOrEqual(0);

      expect(typeof item.actualWorkHours).toBe('number');
      expect(item.actualWorkHours).toBeGreaterThanOrEqual(0);

      expect(typeof item.progressRate).toBe('number');
      expect(item.progressRate).toBeGreaterThanOrEqual(0);
      expect(item.progressRate).toBeLessThanOrEqual(100);

      expect(typeof item.delayFlag).toBe('boolean');

      expect(item.plannedStartDateTime).toBeDefined();
      expect(item.plannedEndDateTime).toBeDefined();
    });

    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.aggregationTimestamp)).toBe(true);

    expect(result.allocationExecutionStatus.length).toBe(mockAllocationExecutionStatusData.length);
  });
});