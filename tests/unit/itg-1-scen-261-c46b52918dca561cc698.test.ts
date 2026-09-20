import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-261: validateDateTimeRangeエラー処理', () => {
  it('開始日時が終了日時より後の場合、InvalidDateRangeErrorを発生させる', async () => {
    // Arrange
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-15T10:00:00Z',
      aggregationEndDateTime: '2024-01-15T09:00:00Z',
      requestUserId: 'USER001',
    };

    // validateDateTimeRange をスタブ化し、InvalidDateRangeError を発生させる
    const validateDateTimeRangeSpy = jest
      .spyOn(dashboardAggregation, 'validateDateTimeRange' as any)
      .mockImplementation(() => {
        const error = new Error('集計期間の開始日時は終了日時より前である必要があります。');
        (error as any).name = 'InvalidDateRangeError';
        throw error;
      });

    // データソースアクセス関数をスタブ化（呼び出されないことを確認するため）
    const listProgressDataSpy = jest
      .spyOn(dashboardAggregation, 'listProgressDataByCondition' as any)
      .mockResolvedValue([]);

    const listDelayRiskSpy = jest
      .spyOn(dashboardAggregation, 'listDelayRiskJudgmentByCondition' as any)
      .mockResolvedValue([]);

    const listAllocationExecutionStatusSpy = jest
      .spyOn(dashboardAggregation, 'listAllocationExecutionStatusByCondition' as any)
      .mockResolvedValue([]);

    const listHandyTerminalSyncLogSpy = jest
      .spyOn(dashboardAggregation, 'listHandyTerminalSyncLogByCondition' as any)
      .mockResolvedValue([]);

    const listImprovementInstructionDeliveryHistorySpy = jest
      .spyOn(dashboardAggregation, 'listImprovementInstructionDeliveryHistoryByCondition' as any)
      .mockResolvedValue([]);

    // Act & Assert
    try {
      await aggregateDashboardData(input);
      fail('InvalidDateRangeErrorが発生することを期待していました');
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();

      // エラー型を確認
      expect((error as any).name).toBe('InvalidDateRangeError');

      // エラーメッセージを確認
      if (error instanceof Error) {
        expect(error.message).toBe('集計期間の開始日時は終了日時より前である必要があります。');
      } else {
        fail('エラーはError型である必要があります');
      }

      // validateDateTimeRange が呼び出されたことを確認
      expect(validateDateTimeRangeSpy).toHaveBeenCalled();

      // すべてのデータソースへのアクセスが呼び出されていないことを確認
      expect(listProgressDataSpy).not.toHaveBeenCalled();
      expect(listDelayRiskSpy).not.toHaveBeenCalled();
      expect(listAllocationExecutionStatusSpy).not.toHaveBeenCalled();
      expect(listHandyTerminalSyncLogSpy).not.toHaveBeenCalled();
      expect(listImprovementInstructionDeliveryHistorySpy).not.toHaveBeenCalled();
    } finally {
      // スパイのクリーンアップ
      validateDateTimeRangeSpy.mockRestore();
      listProgressDataSpy.mockRestore();
      listDelayRiskSpy.mockRestore();
      listAllocationExecutionStatusSpy.mockRestore();
      listHandyTerminalSyncLogSpy.mockRestore();
      listImprovementInstructionDeliveryHistorySpy.mockRestore();
    }
  });
});