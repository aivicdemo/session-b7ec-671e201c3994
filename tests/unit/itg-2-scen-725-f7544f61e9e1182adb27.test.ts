import { validateInputData, ValidationSchema, ValidateInputDataOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-725: strictMode が true でスキーマに定義されていない追加フィールドが存在するとき違反として検出される', () => {
  it('should detect undefined fields as violations when strictMode is true', () => {
    // Arrange
    const dataObject = {
      field1: 'value1',
      field2: 'value2',
      field3: 'unexpected_value',
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'field1',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'field2',
          required: true,
          type: 'string',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData({
      dataObject,
      schema,
      strictMode: true,
    });

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].fieldName).toBe('field3');
    expect(result.violations[0].violationType).toBe('unknown_field');
    expect(result.normalizedData).toBeNull();
  });
});