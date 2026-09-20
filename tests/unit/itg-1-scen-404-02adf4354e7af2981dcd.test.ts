import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-404: decimalPlaces が 0 で小数を入力したとき、PrecisionMismatchError が発生する', () => {
  test('小数を入力し decimalPlaces が 0 の場合、isValid が false で violatedRules に PrecisionMismatchError が含まれる', () => {
    const result = validateNumericQuantity({
      value: 5.5,
      decimalPlaces: 0,
      fieldName: '作業数量',
      allowNegative: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    expect(result.violatedRules).toContain('PrecisionMismatchError');
  });

  test('PrecisionMismatchError のエラー文言が正確に violatedRules に含まれる', () => {
    const result = validateNumericQuantity({
      value: 5.5,
      decimalPlaces: 0,
      fieldName: '作業数量',
      allowNegative: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    expect(result.violatedRules).toEqual(['小数桁数が許容値を超えています。最大 0 桁までです。']);
  });
});