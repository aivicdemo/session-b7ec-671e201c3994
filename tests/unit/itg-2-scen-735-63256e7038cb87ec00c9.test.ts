import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-735: 時刻形式がHH:MM:SS形式でない場合はエラーが返される', () => {
  it('startTimeが範囲外の時間値を含む場合、エラーが返される', () => {
    const result = calculateDateTimeValues({
      calculationType: 'time_difference_minutes',
      startTime: '25:30:00',
      endTime: '14:30:00',
      startDate: null,
      endDate: null,
      referenceDate: null,
      targetDate: null,
      thresholdDays: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('時刻形式が無効です。HH:MM:SS形式で指定してください。');
    expect(result.calculationType).toBe('time_difference_minutes');
    expect(result.timeDifferenceMinutes).toBeNull();
  });
});