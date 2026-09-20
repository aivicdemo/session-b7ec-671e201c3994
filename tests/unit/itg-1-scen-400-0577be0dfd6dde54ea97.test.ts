import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-400: 最小値と等しい数値を入力したとき、正規化された数値を返して成功する', () => {
  it('should return normalized value and succeed when input equals minValue', () => {
    const result = validateNumericQuantity({
      value: 10,
      minValue: 10,
      maxValue: 100,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: '作業数量',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(10);
    expect(typeof result.normalizedValue).toBe('number');
    expect(result.violatedRules).toEqual([]);
  });
});