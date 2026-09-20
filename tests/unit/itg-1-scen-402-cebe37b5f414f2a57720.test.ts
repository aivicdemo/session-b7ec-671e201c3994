import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-402: 許容される小数桁数と一致する小数を入力したとき、正規化された数値を返して成功する', () => {
  it('decimalPlaces=2の条件で、小数点以下2桁の値3.45を入力すると、isValid=true、normalizedValue=3.45、violatedRules=[]を返す', () => {
    const result = validateNumericQuantity({
      value: 3.45,
      minValue: 1.0,
      maxValue: 10.0,
      allowNegative: false,
      decimalPlaces: 2,
      fieldName: '工数',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedValue).toBe(3.45);
    expect(result.violatedRules).toEqual([]);
  });
});