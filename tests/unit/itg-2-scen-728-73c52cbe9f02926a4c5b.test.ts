import { validateInputData, ValidationSchema } from '../../src/logic/authorization-and-validation';

describe('SCEN-728: validateInputData - 検証成功時の動作', () => {
  it('isValid が true で violations が空配列で normalizedData に正規化データが返される', () => {
    // 入力データを構築
    const dataObject = {
      name: '田中太郎',
      email: 'tanaka@example.com',
      age: 30,
    };

    // 検証ルール定義スキーマを構築
    const schema: ValidationSchema = {
      fields: [
        {
          fieldName: 'name',
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
          fieldName: 'age',
          required: true,
          type: 'number',
          minValue: 18,
          maxValue: 65,
        },
      ],
      allowUnknownFields: true,
    };

    // validateInputData を呼び出す
    const result = validateInputData(dataObject, schema, false);

    // 検証結果の確認
    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.normalizedData).not.toBeNull();
    expect(result.normalizedData).toEqual({
      name: '田中太郎',
      email: 'tanaka@example.com',
      age: 30,
    });
  });
});