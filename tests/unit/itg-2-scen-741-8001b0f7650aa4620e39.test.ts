import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';
import { CalculateDateTimeValuesInput, CalculateDateTimeValuesOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-741: 開始日と終了日が同一日の場合は0日が返される', () => {
  it('開始日と終了日が同一日の場合、periodDaysが0を返す', () => {
    const input: CalculateDateTimeValuesInput = {
      calculationType: 'period_days',
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      startTime: null,
      endTime: null,
      referenceDate: null,
      targetDate: null,
      thresholdDays: null,
    };

    const result: CalculateDateTimeValuesOutput = calculateDateTimeValues(input);

    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('period_days');
    expect(result.periodDays).toBe(0);
    expect(result.error).toBeNull();
  });
});