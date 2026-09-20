import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-407: 数値入力検証 - maxValue 未指定時に上限より大きい値を入力', () => {
  it('maxValue が指定されず、上限より大きい正の値を入力したとき、正規化された数値を返して成功する', () => {
    // Arrange
    const input = {
      value: 5000,
      minValue: undefined,
      maxValue: undefined,
      allowNegative: false,
      decimalPlaces: undefined,
      fieldName: '作業数量',
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(5000);
    expect(result.violatedRules).toEqual([]);
  });
});