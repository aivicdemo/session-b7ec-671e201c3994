import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-403: decimalPlaces が 0 で正の整数を入力したとき、正規化された数値を返して成功する', () => {
  it('should return isValid=true with normalizedValue=42 when decimalPlaces=0 and positive integer 42 is input', () => {
    // Act
    const result = validateNumericQuantity({
      value: 42,
      decimalPlaces: 0,
      allowNegative: false,
    });

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(42);
    expect(result.violatedRules).toEqual([]);
  });
});