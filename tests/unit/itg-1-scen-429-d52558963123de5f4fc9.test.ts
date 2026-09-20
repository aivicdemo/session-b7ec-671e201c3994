import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-429: calculateDelayDays with invalid timezone', () => {
  it('should throw InvalidTimeZoneError when an invalid timezone is specified', async () => {
    const input = {
      actualEndDateTime: '2024-01-15T10:30:00Z',
      plannedEndDateTime: '2024-01-15T09:00:00Z',
      timeZone: 'Invalid/TimeZone',
    };

    await expect(calculateDelayDays(input)).rejects.toMatchObject({
      name: 'InvalidTimeZoneError',
      message: '指定されたタイムゾーンは無効です。',
    });
  });
});