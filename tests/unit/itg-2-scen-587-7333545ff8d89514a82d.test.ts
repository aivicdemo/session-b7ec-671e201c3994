import { saveWorkType } from '../../src/logic/persistence-layer';

describe('SCEN-587: 更新時に指定されたworkTypeIdが存在しない場合エラーが発生する', () => {
  it('should return error when updating non-existent workTypeId', async () => {
    const input = {
      workTypeId: 'wt-9999',
      workTypeName: '新規作業タイプ',
      description: undefined,
      standardProductivity: 100,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: 'user002',
      requestingUserId: 'user001',
      operation: 'update' as const,
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
    expect(result.message).toContain('指定された作業タイプが見つかりません。');
  });
});