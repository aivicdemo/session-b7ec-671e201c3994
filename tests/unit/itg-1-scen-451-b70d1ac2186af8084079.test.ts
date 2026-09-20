import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-451: 実績作業時間が null, undefined, 負の数, または 0 のとき、InvalidActualWorkHoursError が発生する', () => {
  it('actualWorkHours が null のとき InvalidActualWorkHoursError が発生する', () => {
    const input = {
      completedCount: 100,
      actualWorkHours: null as any,
      decimalPlaces: 2,
      timeUnitNormalization: 'hour' as const,
    };

    expect(() => {
      calculateProductivityRate(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidActualWorkHoursError',
      message: '実績作業時間は0より大きい数値である必要があります。',
    }));
  });

  it('actualWorkHours が undefined のとき InvalidActualWorkHoursError が発生する', () => {
    const input = {
      completedCount: 100,
      actualWorkHours: undefined as any,
      decimalPlaces: 2,
      timeUnitNormalization: 'hour' as const,
    };

    expect(() => {
      calculateProductivityRate(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidActualWorkHoursError',
      message: '実績作業時間は0より大きい数値である必要があります。',
    }));
  });

  it('actualWorkHours が 0 のとき InvalidActualWorkHoursError が発生する', () => {
    const input = {
      completedCount: 100,
      actualWorkHours: 0,
      decimalPlaces: 2,
      timeUnitNormalization: 'hour' as const,
    };

    expect(() => {
      calculateProductivityRate(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidActualWorkHoursError',
      message: '実績作業時間は0より大きい数値である必要があります。',
    }));
  });

  it('actualWorkHours が負の数のとき InvalidActualWorkHoursError が発生する', () => {
    const input = {
      completedCount: 100,
      actualWorkHours: -10,
      decimalPlaces: 2,
      timeUnitNormalization: 'hour' as const,
    };

    expect(() => {
      calculateProductivityRate(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidActualWorkHoursError',
      message: '実績作業時間は0より大きい数値である必要があります。',
    }));
  });
});