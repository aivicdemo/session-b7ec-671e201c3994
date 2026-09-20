import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-425: calculateDelayDays - InvalidDateTimeFormat error handling', () => {
  it('should throw InvalidDateTimeFormatError when actualEndDateTime has invalid ISO 8601 format', async () => {
    const input = {
      actualEndDateTime: '2024-13-45T25:70:80Z',
      plannedEndDateTime: '2024-01-15T10:00:00Z',
    };

    let errorThrown: Error | null = null;
    let result: any = null;

    try {
      result = calculateDelayDays(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.constructor.name).toBe('InvalidDateTimeFormatError');
    expect(errorThrown?.message).toBe(
      '実績終了日時または予定終了日時の形式が不正です。ISO 8601形式で指定してください。'
    );
    expect(result).toBeUndefined();
  });
});