import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-392: 数値として解析できない文字列入力時のエラー検証', () => {
  it('数値として解析できない文字列を入力したとき、InvalidNumericFormatError が発生する', () => {
    const input = {
      value: 'abc123',
      fieldName: '作業数量',
    };

    expect(() => {
      validateNumericQuantity(input);
    }).toThrow();

    try {
      validateNumericQuantity(input);
    } catch (error: unknown) {
      const err = error as Error;
      expect(err.message).toContain('数値形式が不正です。整数または指定精度の小数で入力してください。');
      expect(err.message).toContain('作業数量');
    }
  });
});