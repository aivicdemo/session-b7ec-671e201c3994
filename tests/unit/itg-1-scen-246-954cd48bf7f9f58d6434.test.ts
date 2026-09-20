import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-246: aggregateDashboardData - Error handling for invalid progress data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when completed quantity exceeds received orders for a team', async () => {
    const facilityIds = ['FAC-001'];
    const teamIds = ['TEAM-A', 'TEAM-B'];
    const aggregationStartDateTime = '2024-01-01T00:00:00Z';
    const aggregationEndDateTime = '2024-01-02T00:00:00Z';
    const requestUserId = 'USER-001';

    const input = {
      facilityIds,
      teamIds,
      aggregationStartDateTime,
      aggregationEndDateTime,
      requestUserId,
    };

    // Mock validateDateTimeRange to pass validation
    jest.spyOn(dashboardAggregation, 'validateDateTimeRange').mockResolvedValue(true);

    // Mock listProgressDataByCondition to return data where TEAM-A has ordersCompleted > ordersReceived
    jest.spyOn(dashboardAggregation, 'listProgressDataByCondition').mockImplementation(
      async (facilityId: string, teamId: string) => {
        if (teamId === 'TEAM-A') {
          // TEAM-A: ordersCompleted (150) > ordersReceived (100) - invalid data
          return [
            {
              progressDataId: 'PROG-001',
              workInstructionId: 'WI-001',
              facilityId: 'FAC-001',
              teamId: 'TEAM-A',
              progressDate: '2024-01-01T00:00:00Z',
              plannedQuantity: 100,
              actualQuantity: 150,
              completionRate: 150,
              delayFlag: true,
              delayDays: 5,
            },
          ];
        } else if (teamId === 'TEAM-B') {
          // TEAM-B: ordersCompleted (75) < ordersReceived (80) - valid data
          return [
            {
              progressDataId: 'PROG-002',
              workInstructionId: 'WI-002',
              facilityId: 'FAC-001',
              teamId: 'TEAM-B',
              progressDate: '2024-01-01T00:00:00Z',
              plannedQuantity: 80,
              actualQuantity: 75,
              completionRate: 93,
              delayFlag: false,
              delayDays: null,
            },
          ];
        }
        return [];
      }
    );

    // Mock listDelayRiskJudgmentByCondition to return normal data
    jest.spyOn(dashboardAggregation, 'listDelayRiskJudgmentByCondition').mockResolvedValue([]);

    // Mock listAllocationExecutionStatusByCondition to return normal data
    jest.spyOn(dashboardAggregation, 'listAllocationExecutionStatusByCondition').mockResolvedValue([]);

    // Mock listProductivityDataByCondition to return normal data
    jest.spyOn(dashboardAggregation, 'listProductivityDataByCondition').mockResolvedValue([]);

    // Mock listHandyTerminalSyncLogByCondition to return normal data
    jest.spyOn(dashboardAggregation, 'listHandyTerminalSyncLogByCondition').mockResolvedValue([]);

    // Mock listWorkInstructionReceptionHistoryByCondition to return normal data
    jest.spyOn(dashboardAggregation, 'listWorkInstructionReceptionHistoryByCondition').mockResolvedValue([]);

    // Call aggregateDashboardData and expect it to throw an error
    let thrownError: any;
    try {
      await aggregateDashboardData(input);
      fail('Expected aggregateDashboardData to throw an error');
    } catch (error) {
      thrownError = error;
    }

    // Verify that an error was thrown
    expect(thrownError).toBeDefined();

    // Verify the error is an Error instance
    expect(thrownError).toBeInstanceOf(Error);

    // Verify the error has a name property
    expect(thrownError.name).toBeDefined();
    expect(typeof thrownError.name).toBe('string');

    // Verify the error message matches the expected business rule violation message
    expect(thrownError.message).toBe('進捗データが不正です。受注数と完了数を確認してください');

    // Verify that the error is not one of the pre-designed error types
    expect(thrownError.name).not.toMatch(/InvalidDateRangeError|FacilityNotFoundError|InsufficientDataError|DataAggregationFailureError/);
  });
});