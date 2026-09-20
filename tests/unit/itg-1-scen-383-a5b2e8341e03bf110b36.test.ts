import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-383: allowPastDateTimeがtrueで開始日時が過去のとき、正常に検証完了する', () => {
  it('過去の日時を許可する設定で、過去の開始日時と終了日時を検証できる', () => {
    const input = {
      startDateTime: '2020-01-01T10:00:00Z',
      endDateTime: '2020-01-01T12:00:00Z',
      allowPastDateTime: true,
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      maxDurationDays: 365,
      timeZone: 'Asia/Tokyo',
    };

    const output = validateDateTimeRange(input);

    expect(output.isValid).toBe(true);
    expect(output.normalizedStartDateTime).toBe('2020-01-01T10:00:00Z');
    expect(output.normalizedEndDateTime).toBe('2020-01-01T12:00:00Z');
    expect(output.durationMinutes).toBe(120);
    expect(output.violatedRules).toEqual([]);
  });
});