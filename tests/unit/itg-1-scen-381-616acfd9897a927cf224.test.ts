import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-381: 開始日時または終了日時が営業時間外のとき、OutsideBusinessHoursErrorが発生する', () => {
  it('startDateTimeが営業時間外（06:00前）の場合、OutsideBusinessHoursErrorが発生する', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(false);
    expect(result.violatedRules).toContain('OutsideBusinessHoursError');
    expect(result.violatedRules.length).toBeGreaterThan(0);
  });

  it('violatedRulesに営業時間外エラーが含まれていることを確認する', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result.violatedRules).toEqual(expect.arrayContaining(['OutsideBusinessHoursError']));
  });

  it('エラー文言が正しく返されること', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(false);
    // エラー情報がviolatedRulesに含まれ、営業時間外エラーの理由が記録されていることを確認
    expect(result.violatedRules).toContain('OutsideBusinessHoursError');
    // violatedRulesはエラーの説明またはエラーコードを含む配列
    expect(Array.isArray(result.violatedRules)).toBe(true);
  });

  it('戻り値に正規化された日時とdurationMinutesが含まれること', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result).toHaveProperty('normalizedStartDateTime');
    expect(result).toHaveProperty('normalizedEndDateTime');
    expect(result).toHaveProperty('durationMinutes');
  });

  it('営業時間外エラーが発生した場合、isValidがfalseであることを確認する', () => {
    const input = {
      startDateTime: '2025-01-15T05:30:00Z',
      endDateTime: '2025-01-15T10:00:00Z',
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(false);
    expect(result.violatedRules.length).toBeGreaterThan(0);
  });
});