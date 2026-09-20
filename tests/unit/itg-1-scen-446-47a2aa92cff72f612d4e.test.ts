import { calculateWorkHours } from '../../src/logic/validation-common-calculation';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('SCEN-446: calculateWorkHours with break time adjustment', () => {
  it('should return work hours excluding break time when work spans across break period', () => {
    const startDateTime = '2024-01-15T10:30:00+09:00';
    const endDateTime = '2024-01-15T14:00:00+09:00';
    const businessHoursStart = '09:00';
    const businessHoursEnd = '18:00';
    const breakStartTime = '12:00';
    const breakEndTime = '13:00';
    const applyBreakAdjustment = true;
    const applyBusinessHoursAdjustment = true;
    const timeZone = 'Asia/Tokyo';
    const allowPastDateTime = true;

    jest.spyOn(validationModule, 'validateDateTimeRange' as any).mockReturnValue({
      isValid: true,
      normalizedStartDateTime: startDateTime,
      normalizedEndDateTime: endDateTime,
      durationMinutes: 210,
      violatedRules: [],
    });

    jest.spyOn(validationModule, 'calculateDurationMinutes' as any).mockReturnValue(150);

    const result = calculateWorkHours({
      startDateTime,
      endDateTime,
      businessHoursStart,
      businessHoursEnd,
      breakStartTime,
      breakEndTime,
      applyBreakAdjustment,
      applyBusinessHoursAdjustment,
      timeZone,
      allowPastDateTime,
    });

    expect(typeof result).toBe('number');
    expect(result).toBe(150);
  });
});