import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-405: allowNegative が true で負の値を入力したとき、正規化された数値を返して成功する', () => {
  it('負の値を入力し、allowNegative が true のとき、isValid が true で normalizedValue が負の値となること', () => {
    const result = validateNumericQuantity({
      value: -50,
      allowNegative: true,
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(-50);
    expect(result.violatedRules).toEqual([]);
  });
});