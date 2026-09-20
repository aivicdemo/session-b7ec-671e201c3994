import { saveWorkType, SaveWorkTypeInput } from '../../src/logic/persistence-layer';

describe('SCEN-581: 作業タイプ名が空文字列の場合エラーが発生する', () => {
  it('should raise InvalidWorkTypeNameError when workTypeName is empty string', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT001',
      workTypeName: '',
      description: 'テスト説明',
      standardProductivity: 100,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      requestingUserId: 'user001',
      operation: 'create'
    };

    try {
      await saveWorkType(input);
      fail('Expected InvalidWorkTypeNameError to be thrown');
    } catch (error: unknown) {
      const err = error as { name: string; message: string };
      expect(err.name).toBe('InvalidWorkTypeNameError');
      expect(err.message).toBe('作業タイプ名は1文字以上255文字以下である必要があります。');
    }
  });
});