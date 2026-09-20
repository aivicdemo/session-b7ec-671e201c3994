import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-738: 終了時刻が開始時刻より前の場合は負の分数が返される', () => {
  it('should return negative minutes when endTime is before startTime', () => {
    const result = calculateDateTimeValues({
      calculationType: 'time_difference_minutes',
      startTime: '14:30:00',
      endTime: '09:15:00',
      startDate: null,
      endDate: null,
      referenceDate: null,
      targetDate: null,
      thresholdDays: null,
    });

    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('time_difference_minutes');
    expect(result.timeDifferenceMinutes).toBe(-315);
    expect(result.periodDays).toBeNull();
    expect(result.periodMinutes).toBeNull();
    expect(result.isWithinThreshold).toBeNull();
    expect(result.daysUntilTarget).toBeNull();
    expect(result.error).toBeNull();
  });
});