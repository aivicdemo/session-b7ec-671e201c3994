import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-449: 完了件数と実績作業時間から時間当たりの処理件数を計算し、生産性率を数値化する', () => {
  test('完了件数と実績作業時間が正常で、時間当たりの処理件数を既定の小数2桁で計算できる', () => {
    // 入力値の妥当性確認
    const completedCount = 120; // 0以上の整数
    const actualWorkHours = 480; // 0より大きい数値（分単位）
    const decimalPlaces = 2; // 小数2桁
    const timeUnitNormalization = 'hour'; // 時間当たり

    // calculateProductivityRate 関数を呼び出す
    const result = calculateProductivityRate({
      completedCount,
      actualWorkHours,
      decimalPlaces,
      timeUnitNormalization,
    });

    // 計算ロジックの検証
    // 生産性率 = completedCount ÷ (actualWorkHours ÷ 60)
    // = 120 ÷ (480 ÷ 60)
    // = 120 ÷ 8
    // = 15.00
    const expectedValue = 15.0;

    // 戻り値の型を確認
    expect(typeof result).toBe('number');

    // 戻り値の値を確認
    expect(result).toBe(expectedValue);

    // 小数桁数が decimalPlaces 以下であることを確認
    const resultStr = result.toFixed(decimalPlaces);
    const resultDecimalPlaces = (resultStr.split('.')[1] || '').length;
    expect(resultDecimalPlaces).toBeLessThanOrEqual(decimalPlaces);

    // InvalidPrecisionError が発生しないことを確認
    expect(() => {
      calculateProductivityRate({
        completedCount,
        actualWorkHours,
        decimalPlaces,
        timeUnitNormalization,
      });
    }).not.toThrow();
  });
});