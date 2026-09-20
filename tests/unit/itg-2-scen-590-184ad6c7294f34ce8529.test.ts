import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput, findWorkTypeById } from '../../src/logic/persistence-layer';

describe('SCEN-590: 正常な更新入力で既存の作業タイプが更新され成功応答が返される', () => {
  it('should update existing work type and return success response', async () => {
    // Arrange
    const existingWorkTypeId = 'WT001';
    const requestingUserId = 'user123';
    const updatingUserId = 'user123';
    const creatingUserId = 'user100';

    const input: SaveWorkTypeInput = {
      workTypeId: existingWorkTypeId,
      workTypeName: '梱包作業（更新版）',
      description: '商品の梱包・発送準備作業',
      standardProductivity: 45.5,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: creatingUserId,
      updatedBy: updatingUserId,
      requestingUserId,
      operation: 'update',
    };

    // Act
    const result = await saveWorkType(input);

    // Assert - Response validation
    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe(existingWorkTypeId);
    expect(result.operation).toBe('update');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message === undefined || result.message === null).toBe(true);

    // Assert - Database persistence validation
    const findResult = await findWorkTypeById({
      workTypeId: existingWorkTypeId,
      requestingUserId,
    });

    expect(findResult.found).toBe(true);
    expect(findResult.workTypeName).toBe('梱包作業（更新版）');
    expect(findResult.description).toBe('商品の梱包・発送準備作業');
    expect(findResult.standardProductivity).toBe(45.5);
    expect(findResult.difficultyLevel).toBe('NORMAL');
    expect(findResult.activeFlag).toBe(true);
    expect(findResult.updatedAt).toBeInstanceOf(Date);
  });
});