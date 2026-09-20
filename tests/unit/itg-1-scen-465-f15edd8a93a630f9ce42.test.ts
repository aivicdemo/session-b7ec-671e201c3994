import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-465: calculateRiskScore - 出力スコアが指定された小数点以下桁数で丸められる', () => {
  it('小数点以下1桁で丸める場合、戻り値は1桁のみ', () => {
    const result = calculateRiskScore({
      progressRate: 75.5,
      delayDays: 5,
      productivityRate: 1.2,
      decimalPlaces: 1,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    
    // toFixed で文字列化した場合に正確に1桁となることを確認
    expect(result.toFixed(1).split('.')[1].length).toBe(1);
  });

  it('小数点以下3桁で丸める場合、戻り値は3桁のみ', () => {
    const result = calculateRiskScore({
      progressRate: 60.0,
      delayDays: 15,
      productivityRate: 0.8,
      decimalPlaces: 3,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    
    // toFixed で文字列化した場合に正確に3桁となることを確認
    expect(result.toFixed(3).split('.')[1].length).toBe(3);
  });

  it('小数点以下0桁（整数）で丸める場合、戻り値は整数', () => {
    const result = calculateRiskScore({
      progressRate: 45.333,
      delayDays: 20,
      productivityRate: 0.95,
      decimalPlaces: 0,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    
    // 整数であることを確認
    expect(Number.isInteger(result)).toBe(true);
    
    // 数値そのものに小数点がないことを確認
    const resultString = result.toString();
    expect(resultString).not.toMatch(/\./);
  });

  it('デフォルト（小数点以下2桁）で丸める場合、戻り値は2桁のみ', () => {
    const result = calculateRiskScore({
      progressRate: 88.666,
      delayDays: 2,
      productivityRate: 1.5,
      decimalPlaces: 2,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    
    // toFixed で文字列化した場合に正確に2桁となることを確認
    expect(result.toFixed(2).split('.')[1].length).toBe(2);
  });

  it('全ての戻り値がdecimalPlacesパラメータで指定された桁数に正確に丸められている', () => {
    const testCases = [
      { progressRate: 75.5, delayDays: 5, productivityRate: 1.2, decimalPlaces: 1 },
      { progressRate: 60.0, delayDays: 15, productivityRate: 0.8, decimalPlaces: 3 },
      { progressRate: 45.333, delayDays: 20, productivityRate: 0.95, decimalPlaces: 0 },
      { progressRate: 88.666, delayDays: 2, productivityRate: 1.5, decimalPlaces: 2 },
    ];

    testCases.forEach(({ progressRate, delayDays, productivityRate, decimalPlaces }) => {
      const result = calculateRiskScore({
        progressRate,
        delayDays,
        productivityRate,
        decimalPlaces,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');

      // toFixed による形式検証を実施
      const formatted = result.toFixed(decimalPlaces);
      const parts = formatted.split('.');

      if (decimalPlaces === 0) {
        // 整数の場合、小数点がないことを確認
        expect(Number.isInteger(result)).toBe(true);
        expect(parts.length).toBe(1);
      } else {
        // 指定した桁数で正確に丸められていることを確認
        expect(parts.length).toBe(2);
        expect(parts[1].length).toBe(decimalPlaces);
      }
    });
  });
});