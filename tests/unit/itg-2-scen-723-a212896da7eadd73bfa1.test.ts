import { validateInputData } from '../../src/logic/authorization-and-validation';

describe('SCEN-723: フィールド値が許容値域を超過したとき FieldValueOutOfRangeError が発生する', () => {
  it('should return validation result with isValid=false when fieldA exceeds max value', () => {
    const dataObject = { fieldA: 150 };
    const schema = {
      fields: [
        {
          fieldName: 'fieldA',
          required: true,
          type: 'number',
          minValue: 0,
          maxValue: 100,
        },
      ],
      allowUnknownFields: false,
    };

    const result = validateInputData(dataObject, schema, false);

    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.violations.length).toBeGreaterThan(0);

    const fieldAViolation = result.violations.find(
      (v) => v.fieldName === 'fieldA'
    );
    expect(fieldAViolation).toBeDefined();
    expect(fieldAViolation?.violationType).toBe('range');
    expect(fieldAViolation?.actualValue).toBe(150);
    expect(fieldAViolation?.message).toContain('フィールド値が許容範囲外です');
    expect(fieldAViolation?.message).toContain('fieldA = 150');
    expect(fieldAViolation?.message).toContain('許容範囲: 0-100');
  });

  it('should include violation details in result when field exceeds range', () => {
    const dataObject = { fieldA: 150 };
    const schema = {
      fields: [
        {
          fieldName: 'fieldA',
          required: true,
          type: 'number',
          minValue: 0,
          maxValue: 100,
        },
      ],
      allowUnknownFields: false,
    };

    const result = validateInputData(dataObject, schema, false);

    expect(result.isValid).toBe(false);
    expect(result.normalizedData).toBeNull();
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.violations.length).toBeGreaterThan(0);

    const fieldAViolation = result.violations.find(
      (v) => v.fieldName === 'fieldA'
    );
    expect(fieldAViolation).toBeDefined();
    expect(fieldAViolation?.violationType).toBe('range');
    expect(fieldAViolation?.actualValue).toBe(150);
    expect(fieldAViolation?.expectedConstraint).toContain('0');
    expect(fieldAViolation?.expectedConstraint).toContain('100');
    expect(fieldAViolation?.message).toBeDefined();
    expect(fieldAViolation?.message).toContain('許容範囲');
  });
});