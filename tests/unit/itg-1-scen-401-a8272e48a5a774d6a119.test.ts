import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-401: 最大値と等しい数値を入力したとき、正規化された数値を返して成功する', () => {
  it('should return isValid true and normalizedValue 100 when input value equals maxValue', () => {
    const input = {
      value: 100,
      minValue: 10,
      maxValue: 100,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: '作業数量',
    };

    const result = validateNumericQuantity(input);

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(100);
    expect(result.violatedRules).toEqual([]);
  });
});