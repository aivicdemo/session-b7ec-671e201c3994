import { calculateDelayDays, CalculateDelayDaysInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-424: calculateDelayDays - 実績終了日時と予定終了日時が同一の場合', () => {
  it('実績終了日時と予定終了日時が同一の場合、ゼロが返される', () => {
    const input: CalculateDelayDaysInput = {
      actualEndDateTime: '2024-01-15T10:30:00Z',
      plannedEndDateTime: '2024-01-15T10:30:00Z',
      timeZone: 'UTC',
    };

    const result = calculateDelayDays(input);

    expect(typeof result).toBe('number');
    expect(result).toBe(0);
  });
});