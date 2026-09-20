import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-237: エラー検証 - 集計期間の開始日時が終了日時より後の場合', () => {
  it('aggregationStartDateTimeが aggregationEndDateTimeより後である場合、InvalidDateRangeErrorを発生させる', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-15T10:00:00Z',
      aggregationEndDateTime: '2024-01-15T09:00:00Z',
      requestUserId: 'USER001',
    };

    await expect(aggregateDashboardData(input)).rejects.toThrow();
    
    try {
      await aggregateDashboardData(input);
    } catch (error: unknown) {
      expect(error).toHaveProperty('name', 'InvalidDateRangeError');
      expect((error as { message?: string }).message).toBe(
        '集計期間の開始日時は終了日時より前である必要があります。'
      );
    }
  });
});