import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-379: 開始日時が終了日時より後のとき、InvalidDateTimeRangeErrorが発生する', () => {
  it('should throw InvalidDateTimeRangeError when startDateTime is after endDateTime', () => {
    const input = {
      startDateTime: '2024-01-15T14:00:00Z',
      endDateTime: '2024-01-15T10:00:00Z',
      allowPastDateTime: true,
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      maxDurationDays: 365,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => {
      validateDateTimeRange(input);
    }).toThrow();

    expect(() => {
      validateDateTimeRange(input);
    }).toThrow(/開始日時は終了日時より前である必要があります/);
  });
});