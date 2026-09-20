import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-734: 日付形式がISO 8601形式でない場合はエラーが返される', () => {
  it('月が13で無効な日付を指定するとエラーが返される', () => {
    const result = calculateDateTimeValues({
      calculationType: 'period_days',
      startDate: '2024-13-01',
      endDate: '2024-12-31',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('日付形式が無効です。ISO 8601形式（YYYY-MM-DD）で指定してください。');
    expect(result.calculationType).toBe('period_days');
  });
});