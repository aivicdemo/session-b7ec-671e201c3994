import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-432: 営業時間内で開始終了した作業について、休憩時間と営業時間外調整を適用した実績作業時間を分単位で返す', () => {
  it('should calculate work hours with break adjustment and business hours adjustment applied', () => {
    const result = calculateWorkHours({
      startDateTime: '2024-01-15T09:30:00+09:00',
      endDateTime: '2024-01-15T17:45:00+09:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: true,
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: true,
    });

    expect(result).toBe(465);
  });
});