import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-394: 数値入力検証 - 0値とallowNegativeパラメータ', () => {
  it('0 を入力し allowNegative が false のとき、NegativeOrZeroQuantityError が発生する', () => {
    // Arrange
    const input = {
      value: 0,
      allowNegative: false,
      fieldName: '作業数量',
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    expect(result.violatedRules).toContain('NegativeOrZeroQuantityError');
    expect(result.violatedRules.join(', ')).toContain('数量は正の値である必要があります');
  });
});