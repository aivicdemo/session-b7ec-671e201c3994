import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-398: 文字列の数値をパースして正の整数に変換できたとき、正規化された数値を返して成功する', () => {
  it('should parse string "42" and return normalized integer value', () => {
    const result = validateNumericQuantity({
      value: '42',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(42);
    expect(typeof result.normalizedValue).toBe('number');
    expect(result.violatedRules).toEqual([]);
  });
});