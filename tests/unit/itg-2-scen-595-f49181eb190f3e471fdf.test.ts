import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';

describe('SCEN-595: descriptionがnullの場合保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('descriptionがnullの場合、SaveWorkTypeOutputが成功を示し、レコードがnullで永続化される', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT-NEW-001',
      workTypeName: '梱包作業',
      description: null,
      standardProductivity: 150.5,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'USER-001',
      updatedBy: undefined,
      requestingUserId: 'USER-001',
      operation: 'create',
    };

    const result: SaveWorkTypeOutput = await saveWorkType(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT-NEW-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });
});