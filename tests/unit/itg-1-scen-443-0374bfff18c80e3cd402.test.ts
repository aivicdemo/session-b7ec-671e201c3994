import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-443: calculateWorkHours with applyBreakAdjustment=false', () => {
  it('should return 480 minutes when break adjustment is disabled', async () => {
    const result = await calculateWorkHours({
      startDateTime: '2024-01-15T09:30:00+09:00',
      endDateTime: '2024-01-15T17:30:00+09:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: false,
      applyBusinessHoursAdjustment: true,
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: true,
    });

    expect(result).toBe(480);
  });
});