import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';

describe('SCEN-582: 作業タイプ名が255文字を超える場合エラーが発生する', () => {
  it('should reject SaveWorkTypeInput when workTypeName exceeds 255 characters', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT-001',
      workTypeName: 'あ'.repeat(256),
      description: 'テスト',
      standardProductivity: 10,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'USER-001',
      requestingUserId: 'USER-001',
      operation: 'create',
      updatedBy: undefined,
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('作業タイプ名は1文字以上255文字以下である必要があります。');
  });
});