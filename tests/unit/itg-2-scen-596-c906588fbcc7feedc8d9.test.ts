import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';

describe('SCEN-596: updatedByが省略された場合は更新操作でもエラーが発生しない', () => {
  it('should complete update operation successfully when updatedBy is undefined', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT001',
      workTypeName: '梱包作業',
      description: undefined,
      standardProductivity: 100,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'USER001',
      updatedBy: undefined,
      requestingUserId: 'USER001',
      operation: 'update',
    };

    const result: SaveWorkTypeOutput = await saveWorkType(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.workTypeId).toBe('WT001');
    expect(result.savedAt).toBeInstanceOf(Date);
  });
});