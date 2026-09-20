import { validateInputData } from '../../src/logic/authorization-and-validation';

describe('SCEN-721: 必須項目が未入力または null のとき RequiredFieldMissingError が発生する', () => {
  it('必須項目が null のときに RequiredFieldMissingError が発生し、違反情報が返される', () => {
    // ValidationSchema を定義する。必須項目として複数のフィールドを指定する。
    const schema = {
      fields: [
        {
          fieldName: 'field1',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
        {
          fieldName: 'field2',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
        {
          fieldName: 'field3',
          required: false,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
      ],
      allowUnknownFields: true,
    };

    // validateInputData() に入力を渡す: field1 が null、field2 に値がある場合
    const dataObject = {
      field1: null,
      field2: '値',
    };

    // validateInputData() を呼び出す
    const result = validateInputData(dataObject, schema, false);

    // 戻り値を確認する
    // isValid = false であることを確認
    expect(result.isValid).toBe(false);

    // violations 配列に必須項目の不足を示す ValidationViolation オブジェクトが含まれることを確認
    expect(result.violations).toBeDefined();
    expect(result.violations.length).toBeGreaterThan(0);

    // field1 が必須項目として検出されていることを確認
    const field1Violation = result.violations.find(v => v.fieldName === 'field1');
    expect(field1Violation).toBeDefined();
    expect(field1Violation?.violationType).toBe('required');
    expect(field1Violation?.actualValue).toBe(null);
    expect(field1Violation?.message).toContain('必須項目');

    // normalizedData = null であることを確認
    expect(result.normalizedData).toBeNull();
  });

  it('複数の必須項目が null のときに全て違反として検出される', () => {
    const schema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
        {
          fieldName: 'userName',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
        {
          fieldName: 'role',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
      ],
      allowUnknownFields: true,
    };

    const dataObject = {
      userId: null,
      userName: null,
      role: '管理者',
    };

    const result = validateInputData(dataObject, schema, false);

    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBe(2);

    const userIdViolation = result.violations.find(v => v.fieldName === 'userId');
    const userNameViolation = result.violations.find(v => v.fieldName === 'userName');

    expect(userIdViolation).toBeDefined();
    expect(userIdViolation?.violationType).toBe('required');
    expect(userNameViolation).toBeDefined();
    expect(userNameViolation?.violationType).toBe('required');

    expect(result.normalizedData).toBeNull();
  });

  it('必須項目が空文字列のときに違反として検出される', () => {
    const schema = {
      fields: [
        {
          fieldName: 'username',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
      ],
      allowUnknownFields: true,
    };

    const dataObject = {
      username: '',
    };

    const result = validateInputData(dataObject, schema, false);

    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);

    const violation = result.violations.find(v => v.fieldName === 'username');
    expect(violation).toBeDefined();
    expect(violation?.actualValue).toBe('');
  });

  it('必須項目が undefined のときに違反として検出される', () => {
    const schema = {
      fields: [
        {
          fieldName: 'email',
          required: true,
          type: 'string',
          format: 'email',
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
      ],
      allowUnknownFields: true,
    };

    const dataObject = {
      email: undefined,
    };

    const result = validateInputData(dataObject, schema, false);

    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);

    const violation = result.violations.find(v => v.fieldName === 'email');
    expect(violation).toBeDefined();
    expect(violation?.violationType).toBe('required');
  });

  it('全ての必須項目が満たされている場合は検証が成功する', () => {
    const schema = {
      fields: [
        {
          fieldName: 'id',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
        {
          fieldName: 'name',
          required: true,
          type: 'string',
          format: null,
          minLength: null,
          maxLength: null,
          minValue: null,
          maxValue: null,
          pattern: null,
          allowedValues: null,
          customValidator: null,
        },
      ],
      allowUnknownFields: true,
    };

    const dataObject = {
      id: '123',
      name: 'テスト',
    };

    const result = validateInputData(dataObject, schema, false);

    expect(result.isValid).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(result.normalizedData).not.toBeNull();
  });
});