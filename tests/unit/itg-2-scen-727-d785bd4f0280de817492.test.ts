import { validateInputData } from '../../src/logic/authorization-and-validation';
import type { ValidationSchema, ValidateInputDataOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-727: validateInputData - 検証失敗時に normalizedData が null で返される', () => {
  it('必須項目が欠落している場合、isValid は false で normalizedData は null を返す', () => {
    // Arrange
    const dataObject = {
      fieldA: undefined,
      fieldB: null,
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'fieldA',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'fieldB',
          required: true,
          type: 'number',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData(dataObject, schema, false);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(result.violations).toBeDefined();
    expect(result.violations.length).toBeGreaterThan(0);

    const requiredViolations = result.violations.filter(
      (v) => v.violationType === 'required'
    );
    expect(requiredViolations.length).toBeGreaterThan(0);
    expect(requiredViolations.some((v) =>
      v.message.includes('必須項目が不足しています')
    )).toBe(true);
  });

  it('複数の必須項目が欠落している場合、全ての欠落を違反として記録する', () => {
    // Arrange
    const dataObject = {
      userId: undefined,
      userName: undefined,
      email: 'test@example.com',
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'userName',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'email',
          required: true,
          type: 'email',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData(dataObject, schema, false);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(result.violations.length).toBeGreaterThanOrEqual(2);

    const missingFieldNames = result.violations
      .filter((v) => v.violationType === 'required')
      .map((v) => v.fieldName);
    expect(missingFieldNames).toContain('userId');
    expect(missingFieldNames).toContain('userName');
  });

  it('必須項目のみ欠落している場合、その項目のみが違反として報告される', () => {
    // Arrange
    const dataObject = {
      requiredField: undefined,
      optionalField: 'value',
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'requiredField',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'optionalField',
          required: false,
          type: 'string',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData(dataObject, schema, false);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].fieldName).toBe('requiredField');
    expect(result.violations[0].violationType).toBe('required');
  });

  it('型の不一致がある場合も isValid は false で normalizedData は null を返す', () => {
    // Arrange
    const dataObject = {
      userId: 'user123',
      count: 'not-a-number',
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'count',
          required: true,
          type: 'number',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData(dataObject, schema, false);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(result.violations.length).toBeGreaterThan(0);

    const typeViolations = result.violations.filter((v) => v.violationType === 'type');
    expect(typeViolations.length).toBeGreaterThan(0);
  });

  it('必須項目欠落と型不一致が同時に発生した場合、両方の違反を記録する', () => {
    // Arrange
    const dataObject = {
      userId: undefined,
      count: 'invalid',
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'count',
          required: true,
          type: 'number',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData(dataObject, schema, false);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(result.violations.length).toBeGreaterThanOrEqual(2);

    const requiredViolations = result.violations.filter((v) => v.violationType === 'required');
    const typeViolations = result.violations.filter((v) => v.violationType === 'type');

    expect(requiredViolations.length).toBeGreaterThan(0);
    expect(typeViolations.length).toBeGreaterThan(0);
  });

  it('違反情報には fieldName、violationType、actualValue、expectedConstraint、message が含まれる', () => {
    // Arrange
    const dataObject = {
      requiredField: null,
    };

    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'requiredField',
          required: true,
          type: 'string',
        },
      ],
      allowUnknownFields: false,
    };

    // Act
    const result: ValidateInputDataOutput = validateInputData(dataObject, schema, false);

    // Assert
    expect(result.violations.length).toBeGreaterThan(0);
    const violation = result.violations[0];
    expect(violation).toHaveProperty('fieldName');
    expect(violation).toHaveProperty('violationType');
    expect(violation).toHaveProperty('actualValue');
    expect(violation).toHaveProperty('expectedConstraint');
    expect(violation).toHaveProperty('message');
    expect(violation.fieldName).toBe('requiredField');
    expect(violation.violationType).toBe('required');
  });
});