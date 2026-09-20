import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-739: calculateDateTimeValues - 対象日が基準日より前の場合は負の日数が返される', () => {
  it('should return negative days when target date is before reference date', () => {
    const result = calculateDateTimeValues({
      calculationType: 'schedule_judgment',
      referenceDate: '2024-01-15',
      targetDate: '2024-01-10',
      thresholdDays: 10,
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
    });

    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('schedule_judgment');
    expect(result.daysUntilTarget).toBe(-5);
    expect(result.isWithinThreshold).toBe(false);
    expect(result.error).toBeNull();
  });
});