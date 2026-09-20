import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-736: calculateDateTimeValues - 開始日が終了日より後の場合', () => {
  it('開始日が終了日より後の場合はエラーが返される', () => {
    const input = {
      calculationType: 'period_days',
      startDate: '2024-12-31',
      endDate: '2024-12-25',
    };

    const result = calculateDateTimeValues(input);

    expect(result.success).toBe(false);
    expect(result.calculationType).toBe('period_days');
    expect(result.periodDays).toBeNull();
    expect(result.error).toBe('開始日は終了日以前である必要があります。');
  });
});