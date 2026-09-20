import { validateInputData, ValidateInputDataInput, ValidateInputDataOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-726: strictMode が false（デフォルト）でスキーマに定義されていない追加フィールドは許容される', () => {
  it('should allow additional fields not defined in schema when strictMode is false', async () => {
    // Arrange
    const dataObject = {
      // スキーマに定義されるフィールド
      userId: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      // スキーマに定義されていない追加フィールド
      additionalField1: 'extra value',
      customAttribute: { nested: 'object' },
      anotherField: 42,
    };

    const schema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
        {
          fieldName: 'email',
          required: true,
          type: 'email',
          format: 'email',
        },
        {
          fieldName: 'name',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      ],
      allowUnknownFields: true,
    };

    const input: ValidateInputDataInput = {
      dataObject,
      schema,
      strictMode: false,
    };

    // Act
    const result: ValidateInputDataOutput = await validateInputData(input);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.normalizedData).toBeDefined();
    expect(result.normalizedData).not.toBeNull();

    // スキーマ定義フィールドが正規化データに含まれていることを確認
    expect(result.normalizedData!.userId).toBe('user123');
    expect(result.normalizedData!.email).toBe('test@example.com');
    expect(result.normalizedData!.name).toBe('Test User');

    // スキーマに定義されていない追加フィールドがそのまま含まれていることを確認
    expect(result.normalizedData!.additionalField1).toBe('extra value');
    expect(result.normalizedData!.customAttribute).toEqual({ nested: 'object' });
    expect(result.normalizedData!.anotherField).toBe(42);
  });

  it('should preserve additional fields when strictMode is not specified (defaults to false)', async () => {
    // Arrange
    const dataObject = {
      username: 'testuser',
      status: 'active',
      metadata: { key: 'value' },
    };

    const schema = {
      fields: [
        {
          fieldName: 'username',
          required: true,
          type: 'string',
          minLength: 3,
          maxLength: 50,
        },
        {
          fieldName: 'status',
          required: true,
          type: 'string',
          allowedValues: ['active', 'inactive', 'pending'],
        },
      ],
      allowUnknownFields: true,
    };

    const input: ValidateInputDataInput = {
      dataObject,
      schema,
      // strictMode を指定しない（デフォルト false）
    };

    // Act
    const result: ValidateInputDataOutput = await validateInputData(input);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.normalizedData).toBeDefined();
    expect(result.normalizedData!.username).toBe('testuser');
    expect(result.normalizedData!.status).toBe('active');
    expect(result.normalizedData!.metadata).toEqual({ key: 'value' });
  });

  it('should include multiple additional fields in normalizedData', async () => {
    // Arrange
    const dataObject = {
      id: 'id-001',
      name: 'Product A',
      internalNote: 'Internal use only',
      systemField1: 'system value 1',
      systemField2: 'system value 2',
      auditTrail: { created: '2024-01-01', modified: '2024-01-02' },
    };

    const schema = {
      fields: [
        {
          fieldName: 'id',
          required: true,
          type: 'string',
          pattern: '^[a-z0-9-]+$',
        },
        {
          fieldName: 'name',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
      ],
      allowUnknownFields: true,
    };

    const input: ValidateInputDataInput = {
      dataObject,
      schema,
      strictMode: false,
    };

    // Act
    const result: ValidateInputDataOutput = await validateInputData(input);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.normalizedData).toBeDefined();

    // すべての追加フィールドが保持されていることを確認
    expect(result.normalizedData!.internalNote).toBe('Internal use only');
    expect(result.normalizedData!.systemField1).toBe('system value 1');
    expect(result.normalizedData!.systemField2).toBe('system value 2');
    expect(result.normalizedData!.auditTrail).toEqual({
      created: '2024-01-01',
      modified: '2024-01-02',
    });
  });

  it('should validate required fields even when additional fields are present', async () => {
    // Arrange
    const dataObject = {
      userId: 'user456',
      extraField: 'should be ignored',
      // requiredField は欠落（期待：違反として検出）
    };

    const schema = {
      fields: [
        {
          fieldName: 'userId',
          required: true,
          type: 'string',
        },
        {
          fieldName: 'requiredField',
          required: true,
          type: 'string',
        },
      ],
      allowUnknownFields: true,
    };

    const input: ValidateInputDataInput = {
      dataObject,
      schema,
      strictMode: false,
    };

    // Act
    const result: ValidateInputDataOutput = await validateInputData(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.fieldName === 'requiredField')).toBe(
      true,
    );
    expect(result.normalizedData).toBeNull();
    // 追加フィールドは違反として検出されていないことを確認
    expect(
      result.violations.some((v) => v.fieldName === 'extraField'),
    ).toBe(false);
  });
});