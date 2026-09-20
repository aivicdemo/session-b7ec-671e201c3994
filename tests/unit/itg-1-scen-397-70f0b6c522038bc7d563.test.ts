import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('作業進捗・人員配置最適化エンジン - 数値入力検証', () => {
  describe('SCEN-397: 許容される小数桁数を超える小数を入力したとき、PrecisionMismatchError が発生する', () => {
    it('小数第3桁を持つ入力値に対して、許容小数桁数2で検証すると、isValid=false、normalizedValue=null、violatedRules に PrecisionMismatchError を含む', () => {
      const result = validateNumericQuantity({
        value: 12.456,
        decimalPlaces: 2,
        fieldName: '作業数量',
      });

      expect(result.isValid).toBe(false);
      expect(result.normalizedValue).toBeNull();
      expect(result.violatedRules).toContain('PrecisionMismatchError');
    });

    it('エラーメッセージが正しく返される', () => {
      const result = validateNumericQuantity({
        value: 12.456,
        decimalPlaces: 2,
        fieldName: '作業数量',
      });

      expect(result.violatedRules.some((rule) =>
        rule.includes('小数桁数が許容値を超えています。最大 2 桁までです。')
      )).toBe(true);
    });
  });
});