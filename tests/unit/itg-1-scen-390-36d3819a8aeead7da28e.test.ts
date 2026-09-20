import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-390: 期間が許容最大日数ちょうどのとき、正常に検証完了する', () => {
  it('should validate successfully when duration equals maxDurationDays', () => {
    const input = {
      startDateTime: '2025-01-01T06:00:00Z',
      endDateTime: '2025-12-31T22:00:00Z',
      maxDurationDays: 365,
    };

    const result = validateDateTimeRange(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedStartDateTime).toBe('2025-01-01T06:00:00Z');
    expect(result.normalizedEndDateTime).toBe('2025-12-31T22:00:00Z');
    expect(result.durationMinutes).toBe(525600);
    expect(result.violatedRules).toEqual([]);
  });
});