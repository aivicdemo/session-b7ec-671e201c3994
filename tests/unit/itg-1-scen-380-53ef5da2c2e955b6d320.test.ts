import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-380: 開始日時と終了日時の差が許容最大期間を超えるとき、DateTimeRangeExceedsLimitErrorが発生する', () => {
  it('should throw DateTimeRangeExceedsLimitError when duration exceeds maxDurationDays', () => {
    const startDateTime = '2025-01-01T06:00:00Z';
    const endDateTime = '2026-02-01T22:00:00Z';
    const maxDurationDays = 365;

    expect(() => {
      validateDateTimeRange({
        startDateTime,
        endDateTime,
        maxDurationDays,
      });
    }).toThrow(expect.objectContaining({
      name: 'DateTimeRangeExceedsLimitError',
      message: '指定された期間が長すぎます。最大365日以内で指定してください。',
    }));
  });
});