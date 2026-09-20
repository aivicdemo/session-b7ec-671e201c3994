import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';

describe('SCEN-580: 正常な新規作成入力で作業タイプが保存され成功応答が返される', () => {
  it('should save new work type and return success response', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WType001',
      workTypeName: 'ピッキング作業',
      description: '商品ピッキング業務',
      standardProductivity: 25.5,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user123',
      requestingUserId: 'user123',
      operation: 'create',
    };

    const result: SaveWorkTypeOutput = await saveWorkType(input);

    expect(result.success).toBe(true);
    expect(result.workTypeId).toBeDefined();
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();

    const timeDiff = Math.abs(Date.now() - result.savedAt.getTime());
    expect(timeDiff).toBeLessThan(5000);
  });
});