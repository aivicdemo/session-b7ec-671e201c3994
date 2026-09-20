import { saveWorkType, SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';

describe('SCEN-591: 標準生産性が0の場合保存される', () => {
  const input: SaveWorkTypeInput = {
    workTypeId: 'WT-NEW-001',
    workTypeName: 'ピッキング作業',
    description: '商品ピッキング業務',
    standardProductivity: 0,
    difficultyLevel: 'NORMAL',
    activeFlag: true,
    createdBy: 'user001',
    updatedBy: undefined,
    requestingUserId: 'user001',
    operation: 'create',
  };

  it('標準生産性が0の場合、SaveWorkTypeOutputでsuccess=true、operation=createで保存される', async () => {
    const result = await saveWorkType(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT-NEW-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });

  it('データベースに新規レコードが正しく永続化される', async () => {
    const result = await saveWorkType(input);

    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT-NEW-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);

    const retrieveInput = {
      workTypeId: 'WT-NEW-001',
      requestingUserId: 'user001',
    };

    const findResult = await require('../../src/logic/persistence-layer').findWorkTypeById(retrieveInput);
    
    expect(findResult.found).toBe(true);
    expect(findResult.workTypeId).toBe('WT-NEW-001');
    expect(findResult.workTypeName).toBe('ピッキング作業');
    expect(findResult.description).toBe('商品ピッキング業務');
    expect(findResult.standardProductivity).toBe(0);
    expect(findResult.difficultyLevel).toBe('NORMAL');
    expect(findResult.activeFlag).toBe(true);
  });
});