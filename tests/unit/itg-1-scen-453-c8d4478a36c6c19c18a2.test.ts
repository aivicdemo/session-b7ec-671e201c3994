import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-453: 時間単位が minute のとき、分当たりの処理件数を計算できる', () => {
  it('completedCount=100, actualWorkHours=480, decimalPlaces=2, timeUnitNormalization="minute" の入力で、分当たりの処理件数 0.21 を返す', () => {
    const result = calculateProductivityRate({
      completedCount: 100,
      actualWorkHours: 480,
      decimalPlaces: 2,
      timeUnitNormalization: 'minute',
    });

    expect(result).toBe(0.21);
  });
});