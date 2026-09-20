import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-422: calculateDelayDays - 遅延日数計算', () => {
  it('予定終了日時より後に実績終了日時がある場合、正の遅延日数が返される', async () => {
    const input = {
      actualEndDateTime: '2024-01-15T18:30:00Z',
      plannedEndDateTime: '2024-01-15T17:00:00Z',
      timeZone: 'UTC',
    };

    const result = await calculateDelayDays(input);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeCloseTo(1.25, 1);
  });
});