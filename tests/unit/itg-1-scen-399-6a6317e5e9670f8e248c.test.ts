import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-399: 数値入力検証 - 範囲内の正の整数', () => {
  it('最小値と最大値の範囲内にある正の整数を入力したとき、正規化された数値を返して成功する', () => {
    // Arrange
    const input = {
      value: 50,
      minValue: 10,
      maxValue: 100,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: '作業数量',
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(50);
    expect(result.violatedRules).toEqual([]);
  });
});