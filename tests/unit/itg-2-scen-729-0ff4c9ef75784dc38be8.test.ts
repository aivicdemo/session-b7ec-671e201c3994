import { validateInputData, ValidationSchema } from '../../src/logic/authorization-and-validation';

describe('SCEN-729: 入力データが空オブジェクトのとき、スキーマに必須項目が定義されていれば違反として検出される', () => {
  it('should detect required field violations when dataObject is empty', () => {
    // Arrange
    const dataObject = {};
    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
        {
          fieldName: 'password',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
      ],
      allowUnknownFields: true,
    };
    const strictMode = false;

    // Act
    const result = validateInputData(dataObject, schema, strictMode);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);

    const userIdViolation = result.violations.find(v => v.fieldName === 'userId');
    expect(userIdViolation).toBeDefined();
    expect(userIdViolation?.violationType).toBe('required');
    expect(userIdViolation?.actualValue).toBeUndefined();
    expect(userIdViolation?.message).toContain('required');

    const passwordViolation = result.violations.find(v => v.fieldName === 'password');
    expect(passwordViolation).toBeDefined();
    expect(passwordViolation?.violationType).toBe('required');
    expect(passwordViolation?.actualValue).toBeUndefined();
    expect(passwordViolation?.message).toContain('required');

    expect(result.normalizedData).toBeNull();
  });
});