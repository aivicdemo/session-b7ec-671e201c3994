import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('itg-2-scen-733: スケジュール判定機能', () => {
  it('スケジュール判定で基準日と対象日と閾値を指定すると期限判定結果が返される', () => {
    const result = calculateDateTimeValues({
      calculationType: 'schedule_judgment',
      referenceDate: '2024-01-15',
      targetDate: '2024-01-20',
      thresholdDays: 7,
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
    });

    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('schedule_judgment');
    expect(result.isWithinThreshold).toBe(true);
    expect(result.daysUntilTarget).toBe(5);
    expect(result.error).toBeNull();
  });
});