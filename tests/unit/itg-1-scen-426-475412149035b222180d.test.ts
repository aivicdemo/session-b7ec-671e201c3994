import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-426: calculateDelayDays - InvalidDateTimeFormatError on invalid plannedEndDateTime', () => {
  it('should throw InvalidDateTimeFormatError when plannedEndDateTime has invalid ISO 8601 format', () => {
    const input = {
      actualEndDateTime: '2024-01-15T09:30:00Z',
      plannedEndDateTime: '2024-01-15T10:00:00X',
      timeZone: 'UTC'
    };

    expect(() => {
      calculateDelayDays(input);
    }).toThrow();

    try {
      calculateDelayDays(input);
      fail('Expected InvalidDateTimeFormatError to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).name).toBe('InvalidDateTimeFormatError');
      expect((error as any).message).toContain(
        '実績終了日時または予定終了日時の形式が不正です。ISO 8601形式で指定してください。'
      );
    }
  });
});