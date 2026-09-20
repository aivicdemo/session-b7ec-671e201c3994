import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-737: 日時計算結果が表現可能な範囲を超える場合はエラーが返される', () => {
  it('極端に大きな期間差分を計算する場合、CalculationOverflowErrorが返される', () => {
    const result = calculateDateTimeValues({
      calculationType: 'period_days',
      startDate: '2020-01-01',
      endDate: '2262-04-11',
      startTime: null,
      endTime: null,
      referenceDate: null,
      targetDate: null,
      thresholdDays: null,
    });

    expect(result.success).toBe(false);
    expect(result.calculationType).toBe('period_days');
    expect(result.error).toContain('日時計算が範囲を超えています。入力値を確認してください。');
    expect(result.periodDays).toBeNull();
  });
});