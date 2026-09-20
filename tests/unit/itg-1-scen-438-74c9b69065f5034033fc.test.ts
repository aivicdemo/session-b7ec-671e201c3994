import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-438: calculateWorkHours営業時間外調整エラー', () => {
  test('営業時間外調整が有効で作業開始日時が営業時間帯外の場合、営業時間制約エラーで拒否する', () => {
    const input = {
      startDateTime: '2024-01-15T08:30:00+09:00',
      endDateTime: '2024-01-15T17:00:00+09:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      applyBusinessHoursAdjustment: true,
    };

    expect(() => {
      calculateWorkHours(input);
    }).toThrow(expect.objectContaining({
      name: 'OutsideBusinessHoursError',
      message: '作業時間は営業時間内（09:00～18:00）である必要があります。',
    }));
  });
});