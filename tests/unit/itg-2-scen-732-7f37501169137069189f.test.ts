import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-732: 時刻差分計算で開始時刻と終了時刻を指定すると分数が返される', () => {
  it('開始時刻と終了時刻を指定して時刻差分を計算する', () => {
    const input = {
      calculationType: 'time_difference_minutes',
      startTime: '09:30:00',
      endTime: '14:45:00',
      startDate: null,
      endDate: null,
      referenceDate: null,
      targetDate: null,
      thresholdDays: null,
    };

    const result = calculateDateTimeValues(input);

    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('time_difference_minutes');
    expect(result.timeDifferenceMinutes).toBe(315);
    expect(result.periodDays).toBeNull();
    expect(result.periodMinutes).toBeNull();
    expect(result.isWithinThreshold).toBeNull();
    expect(result.daysUntilTarget).toBeNull();
    expect(result.error).toBeNull();
  });
});