import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-408: decimalPlaces が指定されず、任意の小数桁の数値を入力したとき、正規化された数値を返して成功する', () => {
  it('should accept arbitrary decimal places when decimalPlaces is undefined', () => {
    const input = {
      value: 42.123456,
      minValue: 0,
      maxValue: 100,
      allowNegative: false,
      decimalPlaces: undefined,
      fieldName: '作業数量',
    };

    const result = validateNumericQuantity(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(42.123456);
    expect(result.violatedRules).toEqual([]);
  });
});