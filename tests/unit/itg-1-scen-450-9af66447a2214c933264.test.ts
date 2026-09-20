import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-450: calculateProductivityRate - 完了件数の検証', () => {
  describe('完了件数が null、undefined、負の数、または整数でないとき、InvalidCompletedCountError が発生する', () => {
    it('completedCount = null のときに InvalidCompletedCountError を発生する', () => {
      expect(() => {
        calculateProductivityRate({
          completedCount: null as any,
          actualWorkHours: 480,
          decimalPlaces: 2,
          timeUnitNormalization: 'hour',
        });
      }).toThrow('完了件数は0以上の整数である必要があります。');
    });

    it('completedCount = undefined のときに InvalidCompletedCountError を発生する', () => {
      expect(() => {
        calculateProductivityRate({
          completedCount: undefined as any,
          actualWorkHours: 480,
          decimalPlaces: 2,
          timeUnitNormalization: 'hour',
        });
      }).toThrow('完了件数は0以上の整数である必要があります。');
    });

    it('completedCount = -5 のときに InvalidCompletedCountError を発生する', () => {
      expect(() => {
        calculateProductivityRate({
          completedCount: -5,
          actualWorkHours: 480,
          decimalPlaces: 2,
          timeUnitNormalization: 'hour',
        });
      }).toThrow('完了件数は0以上の整数である必要があります。');
    });

    it('completedCount = 2.5 のときに InvalidCompletedCountError を発生する', () => {
      expect(() => {
        calculateProductivityRate({
          completedCount: 2.5,
          actualWorkHours: 480,
          decimalPlaces: 2,
          timeUnitNormalization: 'hour',
        });
      }).toThrow('完了件数は0以上の整数である必要があります。');
    });
  });
});