import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-406: minValue が指定されず、下限より小さい正の値を入力したとき', () => {
  it('正規化された数値を返して成功する', () => {
    const result = validateNumericQuantity({
      value: 5,
      minValue: undefined,
      maxValue: 10,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: '作業数量',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(5);
    expect(result.violatedRules).toEqual([]);
  });
});