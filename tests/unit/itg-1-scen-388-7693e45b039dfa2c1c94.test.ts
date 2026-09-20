import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-388: 開始日時と終了日時が同一のとき、経過分数が0で正常に検証完了する', () => {
  it('should validate successfully when start and end datetime are identical', () => {
    const input = {
      startDateTime: '2024-01-15T09:00:00Z',
      endDateTime: '2024-01-15T09:00:00Z',
      allowPastDateTime: true,
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      maxDurationDays: 365,
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedStartDateTime).toBe('2024-01-15T09:00:00Z');
    expect(result.normalizedEndDateTime).toBe('2024-01-15T09:00:00Z');
    expect(result.durationMinutes).toBe(0);
    expect(result.violatedRules).toEqual([]);
  });
});