import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-423: calculateDelayDays - 早期完了時の負の日数計算', () => {
  it('予定終了日時より前に実績終了日時がある場合、負の早期完了日数が返される', async () => {
    const input = {
      actualEndDateTime: '2025-01-15T14:30:00Z',
      plannedEndDateTime: '2025-01-20T16:45:00Z',
      timeZone: 'UTC',
    };

    const result = await calculateDelayDays(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(-5.15625, 2);
  });
});