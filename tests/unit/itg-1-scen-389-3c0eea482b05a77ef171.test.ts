import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-389: 開始日時が営業開始時刻ちょうどで終了日時が営業終了時刻ちょうどのとき、正常に検証完了する', () => {
  it('予定開始日時が営業開始時刻ちょうどで予定終了日時が営業終了時刻ちょうどのとき、検証が成功する', () => {
    const input = {
      startDateTime: '2025-01-15T06:00:00Z',
      endDateTime: '2025-01-15T22:00:00Z',
      allowPastDateTime: true,
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      maxDurationDays: 365,
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedStartDateTime).toBe('2025-01-15T06:00:00Z');
    expect(result.normalizedEndDateTime).toBe('2025-01-15T22:00:00Z');
    expect(result.durationMinutes).toBe(960);
    expect(result.violatedRules).toEqual([]);
  });
});