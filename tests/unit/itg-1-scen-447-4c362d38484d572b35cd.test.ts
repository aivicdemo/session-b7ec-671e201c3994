import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-447: タイムゾーン指定時に適切に日時を解釈して実績作業時間を計算する', () => {
  it('タイムゾーン Asia/Tokyo を指定し、日本時間の作業開始・終了日時から実績作業時間を計算する', async () => {
    const input = {
      startDateTime: '2024-01-15T10:00:00+09:00',
      endDateTime: '2024-01-15T11:30:00+09:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: true,
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: true,
    };

    const result = await calculateWorkHours(input);

    expect(result.workHours).toBe(90);
  });
});