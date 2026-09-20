import { saveWorkType } from '../../src/logic/persistence-layer';
import type { SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-584: 標準生産性が非数値の場合エラーが発生する', () => {
  let dbSaveSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSaveSpy = jest.spyOn(persistenceLayer as any, 'saveToDatabaseWorkType').mockResolvedValue({
      workTypeId: '',
      success: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('標準生産性が文字列の場合、InvalidStandardProductivityErrorを発生させる', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT001',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: 'abc' as any,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('標準生産性は0以上の数値である必要があります');
    expect(dbSaveSpy).not.toHaveBeenCalled();
  });

  it('標準生産性がnullの場合、InvalidStandardProductivityErrorを発生させる', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT002',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: null as any,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('標準生産性は0以上の数値である必要があります');
    expect(dbSaveSpy).not.toHaveBeenCalled();
  });

  it('標準生産性がundefinedの場合、InvalidStandardProductivityErrorを発生させる', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT003',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: undefined as any,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('標準生産性は0以上の数値である必要があります');
    expect(dbSaveSpy).not.toHaveBeenCalled();
  });

  it('標準生産性がNaNの場合、InvalidStandardProductivityErrorを発生させる', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT004',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: NaN,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('標準生産性は0以上の数値である必要があります');
    expect(dbSaveSpy).not.toHaveBeenCalled();
  });

  it('標準生産性がInfinityの場合、InvalidStandardProductivityErrorを発生させる', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT005',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: Infinity,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('標準生産性は0以上の数値である必要があります');
    expect(dbSaveSpy).not.toHaveBeenCalled();
  });

  it('標準生産性が負の数の場合、InvalidStandardProductivityErrorを発生させる', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT006',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: -10,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('標準生産性は0以上の数値である必要があります');
    expect(dbSaveSpy).not.toHaveBeenCalled();
  });

  it('標準生産性が0の場合、成功して保存される', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT007',
      workTypeName: 'テスト作業タイプ',
      description: undefined,
      standardProductivity: 0,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT007');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(dbSaveSpy).toHaveBeenCalled();
  });

  it('標準生産性が正の数の場合、成功して保存される', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT008',
      workTypeName: 'テスト作業タイプ',
      description: 'テスト用の作業タイプです',
      standardProductivity: 50,
      difficultyLevel: 'HARD',
      activeFlag: true,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    const result = await saveWorkType(input);

    expect(result.success).toBe(true);
    expect(result.workTypeId).toBe('WT008');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(dbSaveSpy).toHaveBeenCalled();
  });
});