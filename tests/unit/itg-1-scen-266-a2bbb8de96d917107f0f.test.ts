import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import {
  AggregateDashboardDataInput,
  AggregateDashboardDataOutput,
  HandyTerminalSyncLogData,
  ProgressByFacilityAndTeamData,
  DelayRiskJudgmentResultData,
  AllocationExecutionStatusData,
  ImprovementInstructionDeliveryHistoryData,
} from '../../src/logic/dashboard-aggregation';

// Mock only the data source functions, not aggregateDashboardData itself
jest.mock('../../src/logic/dashboard-aggregation', () => {
  const actual = jest.requireActual('../../src/logic/dashboard-aggregation');
  return {
    ...actual,
    validateDateTimeRange: jest.fn(),
    listHandyTerminalSyncLogByCondition: jest.fn(),
    listProgressDataByCondition: jest.fn(),
    listDelayRiskJudgmentByCondition: jest.fn(),
    listAllocationExecutionStatusByCondition: jest.fn(),
    listProductivityDataByCondition: jest.fn(),
    listWorkInstructionReceptionHistoryByCondition: jest.fn(),
  };
});

describe('SCEN-266: aggregateDashboardData - handyTerminalSyncLog output validation', () => {
  let validateDateTimeRange: jest.Mock;
  let listHandyTerminalSyncLogByCondition: jest.Mock;
  let listProgressDataByCondition: jest.Mock;
  let listDelayRiskJudgmentByCondition: jest.Mock;
  let listAllocationExecutionStatusByCondition: jest.Mock;
  let listProductivityDataByCondition: jest.Mock;
  let listWorkInstructionReceptionHistoryByCondition: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const module = require('../../src/logic/dashboard-aggregation');
    validateDateTimeRange = module.validateDateTimeRange;
    listHandyTerminalSyncLogByCondition = module.listHandyTerminalSyncLogByCondition;
    listProgressDataByCondition = module.listProgressDataByCondition;
    listDelayRiskJudgmentByCondition = module.listDelayRiskJudgmentByCondition;
    listAllocationExecutionStatusByCondition = module.listAllocationExecutionStatusByCondition;
    listProductivityDataByCondition = module.listProductivityDataByCondition;
    listWorkInstructionReceptionHistoryByCondition = module.listWorkInstructionReceptionHistoryByCondition;

    // Setup validateDateTimeRange to return true (normal case: start < end)
    validateDateTimeRange.mockReturnValue(true);

    // Setup handyTerminalSyncLog data
    const syncLog1: HandyTerminalSyncLogData = {
      syncLogId: 'SYNC001',
      workerId: 'WORKER001',
      facilityId: 'FAC001',
      syncType: '作業実績',
      syncStatus: '成功',
      errorMessage: null,
      sendDateTime: '2024-01-15T10:30:00Z',
      receiveDateTime: '2024-01-15T10:30:05Z',
      processingCompleteDateTime: '2024-01-15T10:30:10Z',
    };

    const syncLog2: HandyTerminalSyncLogData = {
      syncLogId: 'SYNC002',
      workerId: 'WORKER002',
      facilityId: 'FAC001',
      syncType: '位置情報',
      syncStatus: '成功',
      errorMessage: null,
      sendDateTime: '2024-01-20T14:45:00Z',
      receiveDateTime: '2024-01-20T14:45:03Z',
      processingCompleteDateTime: '2024-01-20T14:45:08Z',
    };

    listHandyTerminalSyncLogByCondition.mockResolvedValue([syncLog1, syncLog2]);

    // Setup progress data - normal progress data array
    const progressData: ProgressByFacilityAndTeamData = {
      facilityId: 'FAC001',
      facilityName: '東京本社',
      teamId: 'TEAM001',
      teamName: 'チームA',
      completionRate: 85,
      delayFlag: false,
      delayDays: null,
      allocationEfficiency: 92,
    };
    listProgressDataByCondition.mockResolvedValue([progressData]);

    // Setup delay risk judgment data - normal risk judgment data array
    const delayRiskData: DelayRiskJudgmentResultData = {
      riskJudgmentId: 'RISK001',
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      riskLevel: 'MEDIUM',
      delayPredictionDays: 2,
      currentProgressRate: 65,
      plannedProgressRate: 80,
      delayReason: '人員不足',
      recommendedAction: '人員追加',
      actionStatus: '対応中',
      judgmentDateTime: '2024-01-20T10:00:00Z',
    };
    listDelayRiskJudgmentByCondition.mockResolvedValue([delayRiskData]);

    // Setup allocation execution status data - normal allocation data array
    const allocationData: AllocationExecutionStatusData = {
      allocationExecutionStatusId: 'AES001',
      allocationPlanId: 'AP001',
      workInstructionId: 'WI001',
      workerId: 'WORKER001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      allocationState: '配置中',
      plannedWorkHours: 8,
      actualWorkHours: 6.5,
      progressRate: 81,
      delayFlag: false,
      plannedStartDateTime: '2024-01-20T09:00:00Z',
      plannedEndDateTime: '2024-01-20T17:00:00Z',
      actualStartDateTime: '2024-01-20T09:15:00Z',
      actualEndDateTime: null,
    };
    listAllocationExecutionStatusByCondition.mockResolvedValue([allocationData]);

    // Setup productivity data - normal productivity data array
    listProductivityDataByCondition.mockResolvedValue([
      {
        productivityDataId: 'PROD001',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workDate: '2024-01-20',
        plannedWorkTime: 480,
        actualWorkTime: 420,
        completedItems: 125,
        productivityRate: 95,
        qualityScore: 98,
        errorCount: 1,
        skillLevel: '上級',
        remarks: '良好',
      },
    ]);

    // Setup improvement instruction delivery history - normal delivery history array
    const deliveryHistory: ImprovementInstructionDeliveryHistoryData = {
      deliveryHistoryId: 'DELH001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      improvementInstructionContent: '人員追加',
      deliveryDateTime: '2024-01-20T10:30:00Z',
      deliveryStatus: '配信済',
      recipientCount: 5,
      acknowledgedCount: 4,
    };
    listWorkInstructionReceptionHistoryByCondition.mockResolvedValue([deliveryHistory]);
  });

  test('aggregateDashboardData returns output with handyTerminalSyncLog array containing 2 elements', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(result).toBeDefined();
    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(result.handyTerminalSyncLog.length).toBe(2);
  });

  test('each element in handyTerminalSyncLog array has correct HandyTerminalSyncLogData structure', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    result.handyTerminalSyncLog.forEach((syncLog) => {
      expect(syncLog.syncLogId).toBeDefined();
      expect(typeof syncLog.syncLogId).toBe('string');

      expect(syncLog.workerId).toBeDefined();
      expect(typeof syncLog.workerId).toBe('string');

      expect(syncLog.facilityId).toBeDefined();
      expect(typeof syncLog.facilityId).toBe('string');

      expect(syncLog.syncType).toBeDefined();
      expect(typeof syncLog.syncType).toBe('string');

      expect(syncLog.syncStatus).toBeDefined();
      expect(typeof syncLog.syncStatus).toBe('string');

      expect(syncLog.sendDateTime).toBeDefined();
      expect(typeof syncLog.sendDateTime).toBe('string');

      // Optional fields
      if (syncLog.errorMessage !== undefined && syncLog.errorMessage !== null) {
        expect(typeof syncLog.errorMessage).toBe('string');
      }

      if (syncLog.receiveDateTime !== undefined && syncLog.receiveDateTime !== null) {
        expect(typeof syncLog.receiveDateTime).toBe('string');
      }

      if (syncLog.processingCompleteDateTime !== undefined && syncLog.processingCompleteDateTime !== null) {
        expect(typeof syncLog.processingCompleteDateTime).toBe('string');
      }
    });
  });

  test('aggregationTimestamp is returned in ISO 8601 format', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
    // Validate ISO 8601 format
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.aggregationTimestamp)).toBe(true);
  });

  test('all output fields are returned as arrays', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
  });

  test('handyTerminalSyncLog first element contains expected data', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    const firstSyncLog = result.handyTerminalSyncLog[0];
    expect(firstSyncLog.syncLogId).toBe('SYNC001');
    expect(firstSyncLog.workerId).toBe('WORKER001');
    expect(firstSyncLog.facilityId).toBe('FAC001');
    expect(firstSyncLog.syncType).toBe('作業実績');
    expect(firstSyncLog.syncStatus).toBe('成功');
  });

  test('handyTerminalSyncLog second element contains expected data', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    const secondSyncLog = result.handyTerminalSyncLog[1];
    expect(secondSyncLog.syncLogId).toBe('SYNC002');
    expect(secondSyncLog.workerId).toBe('WORKER002');
    expect(secondSyncLog.facilityId).toBe('FAC001');
    expect(secondSyncLog.syncType).toBe('位置情報');
    expect(secondSyncLog.syncStatus).toBe('成功');
  });

  test('progressByFacilityAndTeam contains normal progress data', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(result.progressByFacilityAndTeam.length).toBeGreaterThan(0);
    const progressData = result.progressByFacilityAndTeam[0];
    expect(progressData.facilityId).toBe('FAC001');
    expect(progressData.completionRate).toBe(85);
  });

  test('delayRiskJudgmentResults contains normal risk judgment data', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    const riskData = result.delayRiskJudgmentResults[0];
    expect(riskData.riskLevel).toBe('MEDIUM');
  });

  test('allocationExecutionStatus contains normal allocation data', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(result.allocationExecutionStatus.length).toBeGreaterThan(0);
    const allocationData = result.allocationExecutionStatus[0];
    expect(allocationData.allocationState).toBe('配置中');
  });

  test('improvementInstructionDeliveryHistory contains normal delivery history data', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    expect(result.improvementInstructionDeliveryHistory.length).toBeGreaterThan(0);
    const deliveryData = result.improvementInstructionDeliveryHistory[0];
    expect(deliveryData.deliveryStatus).toBe('配信済');
  });
});