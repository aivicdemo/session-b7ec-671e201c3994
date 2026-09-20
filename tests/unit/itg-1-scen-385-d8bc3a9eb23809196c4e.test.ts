import { validateDateTimeRange, ValidateDateTimeRangeOutput } from '../../src/logic/validation-common-calculation';

describe('SCEN-385: 営業時間外の開始日時指定時のエラー検証', () => {
  it('営業開始時刻より前の開始日時が指定されたとき、isValidがfalse、violatedRulesに OUTSIDE_BUSINESS_HOURS が含まれる', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: false,
      maxDurationDays: 365,
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(false);
    expect(result.violatedRules).toContain('OUTSIDE_BUSINESS_HOURS');
    expect(result.violatedRules.length).toBeGreaterThan(0);
  });

  it('営業開始時刻より前の開始日時が指定されたとき、正規化された開始日時と終了日時が返される', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: false,
      maxDurationDays: 365,
    };

    const result = validateDateTimeRange(input);

    expect(result.normalizedStartDateTime).toBeDefined();
    expect(result.normalizedEndDateTime).toBeDefined();
    expect(typeof result.normalizedStartDateTime).toBe('string');
    expect(typeof result.normalizedEndDateTime).toBe('string');
  });

  it('営業開始時刻より前の開始日時が指定されたとき、経過分数が計算されて返される', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
      allowPastDateTime: false,
      maxDurationDays: 365,
    };

    const result = validateDateTimeRange(input);

    expect(result.durationMinutes).toBeDefined();
    expect(typeof result.durationMinutes).toBe('number');
    expect(result.durationMinutes).toBeGreaterThanOrEqual(0);
  });
});