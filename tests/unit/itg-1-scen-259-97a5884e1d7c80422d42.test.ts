import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-259: aggregateDashboardData - ハンディターミナル連携ログを含むダッシュボードデータ集約', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定の拠点・期間でハンディターミナル連携ログを取得し、HandyTerminalSyncLogData型に変換して出力に含める', async () => {
    // Mock data setup
    const mockHandyTerminalSyncLog = [
      {
        syncLogId: 'SYNC001',
        workerId: 'WORKER001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: '作業実績',
        workInstructionId: 'WI001',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-15T14:00:00Z',
        receiveDateTime: '2024-01-15T14:05:00Z',
        processingCompleteDateTime: '2024-01-15T14:30:00Z',
      },
    ];

    const mockProgressData = [
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-15T00:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: 80,
        delayFlag: false,
        delayDays: null,
      },
    ];

    const mockDelayRiskJudgment = [];
    const mockAllocationExecutionStatus = [];
    const mockProductivityData = [];
    const mockWorkInstructionReceptionHistory = [];

    // Mock dependencies
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'validateDateTimeRange').mockResolvedValue(true);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listProgressDataByCondition').mockResolvedValue(mockProgressData);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listDelayRiskJudgmentByCondition').mockResolvedValue(mockDelayRiskJudgment);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listAllocationExecutionStatusByCondition').mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listProductivityDataByCondition').mockResolvedValue(mockProductivityData);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listHandyTerminalSyncLogByCondition').mockResolvedValue(mockHandyTerminalSyncLog);
    jest.spyOn(require('../../src/logic/dashboard-aggregation'), 'listWorkInstructionReceptionHistoryByCondition').mockResolvedValue(mockWorkInstructionReceptionHistory);

    // Prepare input parameters
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    // Execute
    const result = await aggregateDashboardData(input);

    // Assertions
    expect(result).toBeDefined();
    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(result.handyTerminalSyncLog.length).toBe(1);

    const handyTerminalLogItem = result.handyTerminalSyncLog[0];
    expect(handyTerminalLogItem).toBeDefined();

    // Type validation for HandyTerminalSyncLogData
    expect(typeof handyTerminalLogItem).toBe('object');
    expect(handyTerminalLogItem).toHaveProperty('syncLogId');
    expect(handyTerminalLogItem).toHaveProperty('workerId');
    expect(handyTerminalLogItem).toHaveProperty('facilityId');
    expect(handyTerminalLogItem).toHaveProperty('syncType');
    expect(handyTerminalLogItem).toHaveProperty('syncStatus');
    expect(handyTerminalLogItem).toHaveProperty('errorMessage');
    expect(handyTerminalLogItem).toHaveProperty('sendDateTime');
    expect(handyTerminalLogItem).toHaveProperty('receiveDateTime');
    expect(handyTerminalLogItem).toHaveProperty('processingCompleteDateTime');

    // Field value validation
    expect(handyTerminalLogItem.syncLogId).toBe('SYNC001');
    expect(handyTerminalLogItem.workerId).toBe('WORKER001');
    expect(handyTerminalLogItem.facilityId).toBe('F001');
    expect(handyTerminalLogItem.syncType).toBe('作業実績');
    expect(handyTerminalLogItem.syncStatus).toBe('成功');
    expect(handyTerminalLogItem.errorMessage).toBeNull();
    expect(handyTerminalLogItem.sendDateTime).toBe('2024-01-15T14:00:00Z');
    expect(handyTerminalLogItem.receiveDateTime).toBe('2024-01-15T14:05:00Z');
    expect(handyTerminalLogItem.processingCompleteDateTime).toBe('2024-01-15T14:30:00Z');
  });
});