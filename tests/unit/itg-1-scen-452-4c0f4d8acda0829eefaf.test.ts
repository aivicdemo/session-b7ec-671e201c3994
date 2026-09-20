import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-452: calculateProductivityRate - InvalidPrecisionError when decimal places exceed specified value', () => {
  describe('正常系: 計算結果の小数桁数が指定値以下の場合', () => {
    test('completedCount=100, actualWorkHours=480, decimalPlaces=2 の場合、計算結果12.5の小数桁数が指定値2桁以下であるため、エラーが発生しない', () => {
      const result = calculateProductivityRate({
        completedCount: 100,
        actualWorkHours: 480,
        decimalPlaces: 2,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(12.5);
      expect(result.violatedRules).toEqual([]);
    });

    test('completedCount=10, actualWorkHours=60, decimalPlaces=1 の場合、計算結果10の小数桁数が指定値1桁以下であり、条件を満たすため、エラーが発生しない', () => {
      const result = calculateProductivityRate({
        completedCount: 10,
        actualWorkHours: 60,
        decimalPlaces: 1,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(10);
      expect(result.violatedRules).toEqual([]);
    });

    test('completedCount=50, actualWorkHours=150, decimalPlaces=0 の場合、計算結果20の小数桁数が0桁で指定値0以下であり、エラーが発生しない', () => {
      const result = calculateProductivityRate({
        completedCount: 50,
        actualWorkHours: 150,
        decimalPlaces: 0,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(20);
      expect(result.violatedRules).toEqual([]);
    });
  });

  describe('境界条件: 小数桁数がちょうど指定値に等しい場合', () => {
    test('completedCount=100, actualWorkHours=800, decimalPlaces=2 の場合、計算結果7.5の小数桁数がちょうど1桁で指定値2桁以下であり、エラーが発生しない', () => {
      const result = calculateProductivityRate({
        completedCount: 100,
        actualWorkHours: 800,
        decimalPlaces: 2,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(7.5);
      expect(result.violatedRules).toEqual([]);
    });

    test('completedCount=100, actualWorkHours=600, decimalPlaces=1 の場合、計算結果10の小数桁数が0桁で指定値1桁以下であり、エラーが発生しない', () => {
      const result = calculateProductivityRate({
        completedCount: 100,
        actualWorkHours: 600,
        decimalPlaces: 1,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(10);
      expect(result.violatedRules).toEqual([]);
    });
  });

  describe('エラー系: 計算結果の小数桁数が指定値を超える場合', () => {
    test('completedCount=100, actualWorkHours=540, decimalPlaces=2 の場合、計算結果11.111111...の小数桁数がdecimalPlaces=2を超えるため、isValid=false で返す', () => {
      const result = calculateProductivityRate({
        completedCount: 100,
        actualWorkHours: 540,
        decimalPlaces: 2,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(false);
      expect(result.normalizedValue).toBeNull();
      expect(result.violatedRules).toContain('生産性率の精度が指定値を超えています。');
    });

    test('completedCount=1000, actualWorkHours=333, decimalPlaces=1 の場合、計算結果180.18018...の小数桁数が指定値1桁では表現不可であるため、isValid=false で返す', () => {
      const result = calculateProductivityRate({
        completedCount: 1000,
        actualWorkHours: 333,
        decimalPlaces: 1,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(false);
      expect(result.normalizedValue).toBeNull();
      expect(result.violatedRules).toContain('生産性率の精度が指定値を超えています。');
    });

    test('completedCount=100, actualWorkHours=333, decimalPlaces=0 の場合、計算結果18.018018...の小数桁数が指定値0を超えるため、isValid=false で返す', () => {
      const result = calculateProductivityRate({
        completedCount: 100,
        actualWorkHours: 333,
        decimalPlaces: 0,
        timeUnitNormalization: 'hour',
      });

      expect(result.isValid).toBe(false);
      expect(result.normalizedValue).toBeNull();
      expect(result.violatedRules).toContain('生産性率の精度が指定値を超えています。');
    });
  });
});