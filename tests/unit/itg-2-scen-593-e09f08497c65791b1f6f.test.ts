import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput, findWorkTypeById } from '../../src/logic/persistence-layer';

describe('SCEN-593: saveWorkType - workTypeName 255文字の場合', () => {
  let mockDatabase: Map<string, any>;

  beforeEach(() => {
    mockDatabase = new Map();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save work type with 255-character name successfully', async () => {
    const nameWith255Chars = 'a'.repeat(255);
    
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT-001',
      workTypeName: nameWith255Chars,
      description: 'テスト説明',
      standardProductivity: 10.5,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'USER-001',
      updatedBy: undefined,
      requestingUserId: 'USER-001',
      operation: 'create',
    };

    // saveWorkType を呼び出し
    const result: SaveWorkTypeOutput = await saveWorkType(input);

    // 戻り値の検証
    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.savedAt.getTime()).toBeGreaterThan(Date.now() - 5000);

    // エラーが発生していないことを検証
    expect(result.message).toBeUndefined();

    // データベースに問い合わせて永続化されていることを検証
    const findResult = await findWorkTypeById({
      workTypeId: 'WT-001',
      requestingUserId: 'USER-001',
    });

    expect(findResult.found).toBe(true);
    expect(findResult.workTypeId).toBe('WT-001');
    expect(findResult.workTypeName).toBe(nameWith255Chars);
    expect(findResult.workTypeName.length).toBe(255);
    expect(findResult.standardProductivity).toBe(10.5);
    expect(findResult.difficultyLevel).toBe('NORMAL');
    expect(findResult.activeFlag).toBe(true);
  });
});