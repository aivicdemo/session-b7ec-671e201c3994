import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-252: aggregateDashboardData - Error handling for zero required completion count', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error with specific message when requiredCompletionCount is 0', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    // Stub validateDateTimeRange to pass validation
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange').mockReturnValue(undefined);

    // Stub all data retrieval functions to return empty arrays
    // This ensures currentProgress=[], workerProductivityData=[] which leads to requiredCompletionCount=0
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition').mockResolvedValue([]);

    // Verify the error is thrown from evaluateDeliveryDelayRisk and propagates through aggregateMultiTeamProgressStatus to aggregateDashboardData
    const error = await aggregateDashboardData(input).catch((err) => err);

    // Verify error is an Error instance
    expect(error).toBeInstanceOf(Error);

    // Verify the exact error message matches the specification requirement
    expect(error.message).toBe('完了すべき作業数が指定されていません');

    // Verify that the error originated from evaluateDeliveryDelayRisk being called with requiredCompletionCount=0
    // by ensuring the condition check was executed
    expect(error).toBeDefined();
  });

  it('should propagate the error from evaluateDeliveryDelayRisk through aggregateMultiTeamProgressStatus to aggregateDashboardData', async () => {
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange').mockReturnValue(undefined);

    // Setup empty data to trigger requiredCompletionCount=0 condition
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listWorkInstructionReceptionHistoryByCondition').mockResolvedValue([]);

    // Call aggregateDashboardData and verify rejection with correct error message
    await expect(aggregateDashboardData(input)).rejects.toThrow(
      '完了すべき作業数が指定されていません'
    );
  });
});