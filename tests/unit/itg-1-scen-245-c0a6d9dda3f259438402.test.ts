import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-245: aggregateDashboardData - 受注数が0件の場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('受注数が0件の場合、エラーメッセージ「進捗データが不正です。受注数と完了数を確認してください」をスローする', async () => {
    // スタブ設定
    const mockListProgressDataByCondition = jest
      .spyOn(dashboardAggregation, 'listProgressDataByCondition' as any)
      .mockResolvedValue([
        {
          progressDataId: 'PD001',
          workInstructionId: 'WI001',
          facilityId: 'F001',
          teamId: 'T001',
          progressDate: '2024-01-01',
          plannedQuantity: 0,
          actualQuantity: 0,
          completionRate: 0,
          delayFlag: false,
          delayDays: null,
          ordersReceived: 0,
          ordersCompleted: 0,
          workersAssigned: 3,
        },
      ]);

    const mockListDelayRiskJudgmentByCondition = jest
      .spyOn(dashboardAggregation, 'listDelayRiskJudgmentByCondition' as any)
      .mockResolvedValue([]);

    const mockListAllocationExecutionStatusByCondition = jest
      .spyOn(dashboardAggregation, 'listAllocationExecutionStatusByCondition' as any)
      .mockResolvedValue([]);

    const mockListProductivityDataByCondition = jest
      .spyOn(dashboardAggregation, 'listProductivityDataByCondition' as any)
      .mockResolvedValue([]);

    const mockListHandyTerminalSyncLogByCondition = jest
      .spyOn(dashboardAggregation, 'listHandyTerminalSyncLogByCondition' as any)
      .mockResolvedValue([]);

    const mockListWorkInstructionReceptionHistoryByCondition = jest
      .spyOn(dashboardAggregation, 'listWorkInstructionReceptionHistoryByCondition' as any)
      .mockResolvedValue([]);

    const mockValidateDateTimeRange = jest
      .spyOn(dashboardAggregation, 'validateDateTimeRange' as any)
      .mockResolvedValue(undefined);

    const input = {
      facilityIds: ['F001'],
      teamIds: ['T001'],
      aggregationStartDateTime: '2024-01-01T08:00:00Z',
      aggregationEndDateTime: '2024-01-01T17:00:00Z',
      requestUserId: 'user123',
    };

    const resultPromise = aggregateDashboardData(input);

    expect(resultPromise).toBeInstanceOf(Promise);

    await expect(resultPromise).rejects.toThrow(
      '進捗データが不正です。受注数と完了数を確認してください'
    );

    try {
      await resultPromise;
      fail('エラーがスローされるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        '進捗データが不正です。受注数と完了数を確認してください'
      );
    }

    mockListProgressDataByCondition.mockRestore();
    mockListDelayRiskJudgmentByCondition.mockRestore();
    mockListAllocationExecutionStatusByCondition.mockRestore();
    mockListProductivityDataByCondition.mockRestore();
    mockListHandyTerminalSyncLogByCondition.mockRestore();
    mockListWorkInstructionReceptionHistoryByCondition.mockRestore();
    mockValidateDateTimeRange.mockRestore();
  });

  it('完了数が受注数を超えている場合、エラーメッセージ「進捗データが不正です。受注数と完了数を確認してください」をスローする', async () => {
    // スタブ設定
    const mockListProgressDataByCondition = jest
      .spyOn(dashboardAggregation, 'listProgressDataByCondition' as any)
      .mockResolvedValue([
        {
          progressDataId: 'PD002',
          workInstructionId: 'WI002',
          facilityId: 'F001',
          teamId: 'T001',
          progressDate: '2024-01-01',
          plannedQuantity: 100,
          actualQuantity: 150,
          completionRate: 150,
          delayFlag: false,
          delayDays: null,
          ordersReceived: 100,
          ordersCompleted: 150,
          workersAssigned: 3,
        },
      ]);

    const mockListDelayRiskJudgmentByCondition = jest
      .spyOn(dashboardAggregation, 'listDelayRiskJudgmentByCondition' as any)
      .mockResolvedValue([]);

    const mockListAllocationExecutionStatusByCondition = jest
      .spyOn(dashboardAggregation, 'listAllocationExecutionStatusByCondition' as any)
      .mockResolvedValue([]);

    const mockListProductivityDataByCondition = jest
      .spyOn(dashboardAggregation, 'listProductivityDataByCondition' as any)
      .mockResolvedValue([]);

    const mockListHandyTerminalSyncLogByCondition = jest
      .spyOn(dashboardAggregation, 'listHandyTerminalSyncLogByCondition' as any)
      .mockResolvedValue([]);

    const mockListWorkInstructionReceptionHistoryByCondition = jest
      .spyOn(dashboardAggregation, 'listWorkInstructionReceptionHistoryByCondition' as any)
      .mockResolvedValue([]);

    const mockValidateDateTimeRange = jest
      .spyOn(dashboardAggregation, 'validateDateTimeRange' as any)
      .mockResolvedValue(undefined);

    const input = {
      facilityIds: ['F001'],
      teamIds: ['T001'],
      aggregationStartDateTime: '2024-01-01T08:00:00Z',
      aggregationEndDateTime: '2024-01-01T17:00:00Z',
      requestUserId: 'user123',
    };

    const resultPromise = aggregateDashboardData(input);

    expect(resultPromise).toBeInstanceOf(Promise);

    await expect(resultPromise).rejects.toThrow(
      '進捗データが不正です。受注数と完了数を確認してください'
    );

    try {
      await resultPromise;
      fail('エラーがスローされるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        '進捗データが不正です。受注数と完了数を確認してください'
      );
    }

    mockListProgressDataByCondition.mockRestore();
    mockListDelayRiskJudgmentByCondition.mockRestore();
    mockListAllocationExecutionStatusByCondition.mockRestore();
    mockListProductivityDataByCondition.mockRestore();
    mockListHandyTerminalSyncLogByCondition.mockRestore();
    mockListWorkInstructionReceptionHistoryByCondition.mockRestore();
    mockValidateDateTimeRange.mockRestore();
  });
});