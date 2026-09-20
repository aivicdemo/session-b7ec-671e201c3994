import { calculateProductivityRate } from '../../src/logic/validation-common-calculation';

describe('SCEN-455: 生産性率の計算（小数桁数指定）', () => {
  it('小数桁数を指定したとき、その精度で丸められた結果が返される', () => {
    // Arrange
    const input = {
      completedCount: 100,
      actualWorkHours: 480,
      decimalPlaces: 3,
      timeUnitNormalization: 'hour' as const,
    };

    // Act
    const result = calculateProductivityRate(input);

    // Assert
    // 計算ロジック: 100 ÷ (480 ÷ 60) = 100 ÷ 8 = 12.5
    // 小数桁数 3 で丸められた結果として 12.5 が返される
    expect(result).toBe(12.5);
    // 小数桁数 3 の精度で表現した場合の文字列が "12.500" となることを確認
    expect(result.toFixed(3)).toBe('12.500');
  });
});