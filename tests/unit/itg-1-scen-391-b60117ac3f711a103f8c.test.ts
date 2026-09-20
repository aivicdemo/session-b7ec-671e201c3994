import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-391: 正の整数を数値型で入力したとき、正規化された数値を返して成功する', () => {
  it('should normalize positive integer input and return success', () => {
    const input = {
      value: 42,
      minValue: 1,
      maxValue: 100,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: '作業数量',
    };

    const result = validateNumericQuantity(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(42);
    expect(result.violatedRules).toEqual([]);
  });
});