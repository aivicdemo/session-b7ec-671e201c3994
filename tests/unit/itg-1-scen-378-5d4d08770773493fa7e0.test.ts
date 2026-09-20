import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-378: validateDateTimeRange - ISO 8601形式チェック', () => {
  it('開始日時がISO 8601形式でないとき、InvalidDateTimeFormatErrorが発生する', () => {
    const input = {
      startDateTime: '2024-01-15 10:00:00',
      endDateTime: '2024-01-15T18:00:00Z',
    };

    expect(() => validateDateTimeRange(input)).toThrow();
    
    try {
      validateDateTimeRange(input);
      fail('例外がスローされるべきです');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('日時形式が不正です');
      expect(error.message).toContain('ISO 8601形式');
    }
  });
});