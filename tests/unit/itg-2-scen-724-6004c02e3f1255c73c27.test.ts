import { validateInputData, ValidationSchema, FieldValidationRule } from '../../src/logic/authorization-and-validation';

describe('SCEN-724: 複数の検証違反が同時に存在するとき violations 配列にすべての違反が含まれる', () => {
  it('should include all violations in violations array when multiple validation errors exist simultaneously', async () => {
    // 1. 検証スキーマを定義
    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'requiredField',
          required: true,
          type: 'string',
        } as FieldValidationRule,
        {
          fieldName: 'formatField',
          required: true,
          type: 'email',
          format: 'email',
        } as FieldValidationRule,
        {
          fieldName: 'rangeField',
          required: true,
          type: 'number',
          minValue: 0,
          maxValue: 100,
        } as FieldValidationRule,
      ],
      allowUnknownFields: false,
    };

    // 2. 複数の検証違反を含むデータオブジェクトを作成
    // (1) 必須フィールドが null（未入力）
    // (2) メールアドレス形式が不正
    // (3) 値が許容範囲外
    const dataObject = {
      requiredField: null, // 必須項目未入力
      formatField: 'invalid-email-format', // 形式違反
      rangeField: 150, // 値域違反（最大100を超過）
    };

    // 3. validateInputData を呼び出す
    const result = await validateInputData({
      dataObject,
      schema,
      strictMode: false,
    });

    // 4. 検証結果を確認
    // isValid は false であること
    expect(result.isValid).toBe(false);

    // violations 配列に3つの違反がすべて含まれること
    expect(result.violations).toBeDefined();
    expect(result.violations.length).toBeGreaterThanOrEqual(3);

    // 各違反の種別を確認
    const violationTypes = result.violations.map((v) => v.violationType);
    expect(violationTypes).toContain('required');
    expect(violationTypes).toContain('format');
    expect(violationTypes).toContain('range');

    // 各違反にフィールド名が含まれること
    const violationFields = result.violations.map((v) => v.fieldName);
    expect(violationFields).toContain('requiredField');
    expect(violationFields).toContain('formatField');
    expect(violationFields).toContain('rangeField');

    // normalizedData は null であること
    expect(result.normalizedData).toBeNull();

    // 各違反に詳細情報が含まれること
    result.violations.forEach((violation) => {
      expect(violation.fieldName).toBeDefined();
      expect(violation.violationType).toBeDefined();
      expect(violation.actualValue).toBeDefined();
      expect(violation.expectedConstraint).toBeDefined();
      expect(violation.message).toBeDefined();
    });
  });
});