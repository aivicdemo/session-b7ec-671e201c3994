import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-434: calculateWorkHours - エラーケース', () => {
  it('作業終了日時がISO 8601形式でない場合、日時形式エラーで拒否する', () => {
    const input = {
      startDateTime: '2024-01-15T09:00:00Z',
      endDateTime: 'invalid-date-format',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: true,
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: true,
    };

    expect(() => {
      calculateWorkHours(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidDateTimeFormatError',
      message: '作業開始日時または作業終了日時の形式が不正です。ISO 8601 形式で指定してください。',
    }));
  });
});