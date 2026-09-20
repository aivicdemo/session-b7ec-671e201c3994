import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

// Mock the internal dependencies
jest.mock('../../src/logic/dashboard-aggregation', () => {
  const actualModule = jest.requireActual('../../src/logic/dashboard-aggregation');
  return {
    ...actualModule,
    validateDateTimeRange: jest.fn(),
    listProgressDataByCondition: jest.fn(),
    listDelayRiskJudgmentByCondition: jest.fn(),
    listAllocationExecutionStatusByCondition: jest.fn(),
    listProductivityDataByCondition: jest.fn(),
    listHandyTerminalSyncLogByCondition: jest.fn(),
    listWorkInstructionReceptionHistoryByCondition: jest.fn(),
  };
});

describe('SCEN-240: エラー：複数データソースからの集約処理中にシステムエラーが発生した場合、DataAggregationFailureErrorを発生させる', () => {
  let mockValidateDateTimeRange: jest.Mock;
  let mockListProgressDataByCondition: jest.Mock;
  let mockListDelayRiskJudgmentByCondition: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockListProductivityDataByCondition: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockListWorkInstructionReceptionHistoryByCondition: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateDateTimeRange = dashboardAggregation.validateDateTimeRange as jest.Mock;
    mockListProgressDataByCondition = dashboardAggregation.listProgressDataByCondition as jest.Mock;
    mockListDelayRiskJudgmentByCondition = dashboardAggregation.listDelayRiskJudgmentByCondition as jest.Mock;
    mockListAllocationExecutionStatusByCondition = dashboardAggregation.listAllocationExecutionStatusByCondition as jest.Mock;
    mockListProductivityDataByCondition = dashboardAggregation.listProductivityDataByCondition as jest.Mock;
    mockListHandyTerminalSyncLogByCondition = dashboardAggregation.listHandyTerminalSyncLogByCondition as jest.Mock;
    mockListWorkInstructionReceptionHistoryByCondition = dashboardAggregation.listWorkInstructionReceptionHistoryByCondition as jest.Mock;

    // validateDateTimeRange は正常系で成功を返す
    mockValidateDateTimeRange.mockResolvedValue(undefined);
  });

  it('should throw DataAggregationFailureError with correct message when system error occurs during aggregation', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    // listProgressDataByCondition がシステムエラーをシミュレート
    const systemError = new Error('Database connection failed');
    mockListProgressDataByCondition.mockRejectedValue(systemError);

    // 他のデータソースはデフォルト値を返す（呼び出されない想定）
    mockListDelayRiskJudgmentByCondition.mockResolvedValue([]);
    mockListAllocationExecutionStatusByCondition.mockResolvedValue([]);
    mockListProductivityDataByCondition.mockResolvedValue([]);
    mockListHandyTerminalSyncLogByCondition.mockResolvedValue([]);
    mockListWorkInstructionReceptionHistoryByCondition.mockResolvedValue([]);

    try {
      await aggregateDashboardData(input);
      fail('Expected DataAggregationFailureError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DataAggregationFailureError');
      expect(error.message).toBe('ダッシュボードデータの集約に失敗しました。');
    }
  });
});