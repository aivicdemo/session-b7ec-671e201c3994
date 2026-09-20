import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-444: calculateWorkHours - applyBusinessHoursAdjustmentがfalseの場合', () => {
  it('営業時間外調整フラグがfalseの場合、営業時間外の時間を除外しない実績作業時間を返す', async () => {
    const input = {
      startDateTime: '2024-01-15T08:00:00',
      endDateTime: '2024-01-15T19:00:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: false,
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: true,
    };

    const result = await calculateWorkHours(input);

    expect(result.durationMinutes).toBe(600);
  });
});