import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-440: calculateWorkHours with invalid break time configuration', () => {
  test('should throw InvalidBreakTimeConfigError when breakStartTime is after breakEndTime', () => {
    const input = {
      startDateTime: '2024-01-15T09:00:00+09:00',
      endDateTime: '2024-01-15T18:00:00+09:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      breakStartTime: '13:00',
      breakEndTime: '12:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: true,
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: true,
    };

    expect(() => {
      calculateWorkHours(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidBreakTimeConfigError',
      message: '休憩開始時刻は休憩終了時刻より前である必要があります。',
    }));
  });
});