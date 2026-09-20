import { validateNumericQuantity } from '../../src/logic/validation-common-calculation';

describe('SCEN-409: validateNumericQuantity - 複数の検証ルール違反がある場合、すべての違反ルール名が violatedRules に含まれる', () => {
  it('should return isValid=false and include PrecisionMismatchError when value has decimals but decimalPlaces is 0', () => {
    // Arrange
    const input = {
      value: 15.5,
      minValue: 10,
      maxValue: 20,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: 'work_quantity'
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    expect(result.violatedRules).toBeDefined();
    expect(Array.isArray(result.violatedRules)).toBe(true);
    
    // 複数の違反ルールが含まれることを確認（2つ以上）
    expect(result.violatedRules.length).toBeGreaterThanOrEqual(2);
    
    // 精度違反ルール（PrecisionMismatchError）が必ず含まれていることを確認
    expect(result.violatedRules).toContain('PrecisionMismatchError');
    
    // すべての違反ルール要素が文字列であること
    result.violatedRules.forEach(ruleName => {
      expect(typeof ruleName).toBe('string');
      expect(ruleName.length).toBeGreaterThan(0);
    });
  });

  it('should handle input value 15.5 with decimalPlaces=0 constraint and include PrecisionMismatchError with additional violation', () => {
    // Arrange
    const input = {
      value: 15.5,
      minValue: 10,
      maxValue: 20,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: 'work_quantity'
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    
    // 複数の違反ルールが記録されている（2つ以上）
    expect(result.violatedRules.length).toBeGreaterThanOrEqual(2);
    
    // PrecisionMismatchError が含まれていることを確認
    expect(result.violatedRules).toContain('PrecisionMismatchError');
    
    // 別の検証ルール違反が同時に含まれていることを確認（複数ルール違反）
    const hasPrecisionError = result.violatedRules.includes('PrecisionMismatchError');
    const hasOtherViolation = result.violatedRules.some(
      rule => rule !== 'PrecisionMismatchError'
    );
    expect(hasPrecisionError && hasOtherViolation).toBe(true);
    
    // すべての要素が文字列で説明内容を持つ
    result.violatedRules.forEach(rule => {
      expect(typeof rule).toBe('string');
      expect(rule.length).toBeGreaterThan(0);
    });
  });

  it('should include PrecisionMismatchError and at least one additional rule when value has decimals but decimalPlaces is 0', () => {
    // Arrange
    const input = {
      value: 15.5,
      minValue: 10,
      maxValue: 20,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: 'quantity'
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    
    // 複数の検証ルール違反が存在することを確認（最低2つ）
    expect(result.violatedRules.length).toBeGreaterThanOrEqual(2);
    
    // 設計済みエラー名 PrecisionMismatchError が含まれていることを確認
    expect(result.violatedRules).toContain('PrecisionMismatchError');
    
    // 複数のルール違反が同時に検出されていることを確認
    // （PrecisionMismatchError以外の違反ルールも存在）
    const otherRules = result.violatedRules.filter(
      rule => rule !== 'PrecisionMismatchError'
    );
    expect(otherRules.length).toBeGreaterThanOrEqual(1);
    
    // violatedRules に記録されたすべての要素が文字列の説明文であること
    result.violatedRules.forEach(rule => {
      expect(typeof rule).toBe('string');
      expect(rule.trim().length).toBeGreaterThan(0);
    });
  });

  it('should verify that PrecisionMismatchError and other violations are present simultaneously', () => {
    // Arrange
    const input = {
      value: 15.5,
      minValue: 10,
      maxValue: 20,
      allowNegative: false,
      decimalPlaces: 0,
      fieldName: 'quantity'
    };

    // Act
    const result = validateNumericQuantity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBeNull();
    
    // violatedRules は複数の違反を記録しているはず
    expect(result.violatedRules).toBeDefined();
    expect(Array.isArray(result.violatedRules)).toBe(true);
    expect(result.violatedRules.length).toBeGreaterThanOrEqual(2);
    
    // PrecisionMismatchError（小数桁数違反）が必須で含まれている
    expect(result.violatedRules).toContain('PrecisionMismatchError');
    
    // PrecisionMismatchError以外の違反ルールも同時に含まれていることを確認
    const nonPrecisionErrors = result.violatedRules.filter(
      rule => rule !== 'PrecisionMismatchError'
    );
    expect(nonPrecisionErrors.length).toBeGreaterThanOrEqual(1);
    
    // すべての違反ルール名が非空の文字列であること
    result.violatedRules.forEach(ruleName => {
      expect(typeof ruleName).toBe('string');
      expect(ruleName).toBeTruthy();
    });
  });
});