import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-454: 時間単位が day のとき、日当たりの処理件数を計算できる', () => {
  it('should calculate daily processing count when timeUnitNormalization is "day"', () => {
    const result = calculateProductivityRate({
      completedCount: 100,
      actualWorkHours: 1440,
      decimalPlaces: 2,
      timeUnitNormalization: 'day',
    });

    expect(typeof result).toBe('number');
    expect(result).toBe(100);
  });
});