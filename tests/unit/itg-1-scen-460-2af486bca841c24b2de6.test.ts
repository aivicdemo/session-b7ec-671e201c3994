import { CalculateRiskScoreInput } from '../../src/logic/validation-common-calculation';
import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-460: calculateRiskScore - Missing Required Indicator Error Handling', () => {
  describe('必須指標（進捗率、遅延日数、生産性率）のいずれかがnullまたはundefinedの場合', () => {
    test('progressRateがnullの場合、MissingRequiredIndicatorErrorが発生する', () => {
      const input: CalculateRiskScoreInput = {
        progressRate: null as any,
        delayDays: 5,
        productivityRate: 2.5,
      };

      expect(() => {
        calculateRiskScore(input);
      }).toThrow();

      try {
        calculateRiskScore(input);
      } catch (error: any) {
        expect(error.name).toBe('MissingRequiredIndicatorError');
        expect(error.message).toContain('進捗率、遅延日数、生産性率は必須です。');
      }
    });

    test('delayDaysがundefinedの場合、MissingRequiredIndicatorErrorが発生する', () => {
      const input: CalculateRiskScoreInput = {
        progressRate: 50,
        delayDays: undefined as any,
        productivityRate: 2.5,
      };

      expect(() => {
        calculateRiskScore(input);
      }).toThrow();

      try {
        calculateRiskScore(input);
      } catch (error: any) {
        expect(error.name).toBe('MissingRequiredIndicatorError');
        expect(error.message).toContain('進捗率、遅延日数、生産性率は必須です。');
      }
    });

    test('productivityRateがnullの場合、MissingRequiredIndicatorErrorが発生する', () => {
      const input: CalculateRiskScoreInput = {
        progressRate: 50,
        delayDays: 5,
        productivityRate: null as any,
      };

      expect(() => {
        calculateRiskScore(input);
      }).toThrow();

      try {
        calculateRiskScore(input);
      } catch (error: any) {
        expect(error.name).toBe('MissingRequiredIndicatorError');
        expect(error.message).toContain('進捗率、遅延日数、生産性率は必須です。');
      }
    });

    test('エラー発生時は数値スコア（0～100）が返されないことを確認', () => {
      const input: CalculateRiskScoreInput = {
        progressRate: null as any,
        delayDays: 5,
        productivityRate: 2.5,
      };

      let result: any;
      try {
        result = calculateRiskScore(input);
      } catch (error) {
        result = undefined;
      }

      expect(result).toBeUndefined();
    });
  });
});