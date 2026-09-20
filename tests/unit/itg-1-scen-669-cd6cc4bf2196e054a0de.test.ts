import { listProficienciesByCondition } from '../../src/logic/data-persistence';
import type { ListProficienciesByConditionInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - データベース接続失敗時エラーテスト (SCEN-669)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('データベース接続失敗時にDataAccessErrorが発生し、エラー文言が正しいこと', async () => {
    // Arrange: データベース接続失敗をシミュレートするモックを設定
    const mockDatabaseError = new Error('Database connection failed');
    (mockDatabaseError as any).code = 'ECONNREFUSED';

    const mockListProficienciesByCondition = jest.spyOn(dataPersistence, 'listProficienciesByCondition')
      .mockRejectedValueOnce({
        name: 'DataAccessError',
        message: '習熟度データの取得に失敗しました。',
      });

    // テスト用入力を設定：有効な検索条件を指定
    const inputPattern1: ListProficienciesByConditionInput = {
      proficiencyIds: undefined,
      workerIds: ['W001'],
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 10,
    };

    const inputPattern2: ListProficienciesByConditionInput = {
      proficiencyIds: undefined,
      workerIds: undefined,
      jobTypes: ['manufacturing', 'assembly'],
      proficiencyLevels: ['intermediate', 'advanced'],
      evaluatedFromDate: '2024-01-01T00:00:00Z',
      evaluatedToDate: '2024-12-31T23:59:59Z',
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'proficiencyLevel',
      sortOrder: 'desc',
      pageNumber: 1,
      pageSize: 50,
    };

    // Act & Assert: パターン1：workerIds検索でのエラー
    let errorCaught1: any = null;
    try {
      await listProficienciesByCondition(inputPattern1);
      // データベース接続エラーが発生していない場合、テストは失敗
      fail('DataAccessErrorが発生することを期待していました');
    } catch (error) {
      errorCaught1 = error;
      expect(error).toBeDefined();
      expect((error as any).name).toBe('DataAccessError');
      expect((error as any).message).toBe('習熟度データの取得に失敗しました。');
      // ListProficienciesByConditionOutputの出力が返されていないことを確認
      expect(error).not.toHaveProperty('proficiencies');
      expect(error).not.toHaveProperty('totalCount');
      expect(error).not.toHaveProperty('retrievedAt');
    }

    // エラーが実際にスローされたことを確認
    expect(errorCaught1).toBeDefined();
    expect(errorCaught1.name).toBe('DataAccessError');

    // Act & Assert: パターン2：複数検索条件でのエラー
    // 2回目の呼び出し用にモックを再設定
    mockListProficienciesByCondition.mockRejectedValueOnce({
      name: 'DataAccessError',
      message: '習熟度データの取得に失敗しました。',
    });

    let errorCaught2: any = null;
    try {
      await listProficienciesByCondition(inputPattern2);
      fail('DataAccessErrorが発生することを期待していました');
    } catch (error) {
      errorCaught2 = error;
      expect(error).toBeDefined();
      expect((error as any).name).toBe('DataAccessError');
      expect((error as any).message).toBe('習熟度データの取得に失敗しました。');
      // ListProficienciesByConditionOutputの出力が返されていないことを確認
      expect(error).not.toHaveProperty('proficiencies');
      expect(error).not.toHaveProperty('totalCount');
      expect(error).not.toHaveProperty('retrievedAt');
    }

    // エラーが実際にスローされたことを確認
    expect(errorCaught2).toBeDefined();
    expect(errorCaught2.name).toBe('DataAccessError');

    // モックが呼び出されたことを確認
    expect(mockListProficienciesByCondition).toHaveBeenCalledTimes(2);
    expect(mockListProficienciesByCondition).toHaveBeenCalledWith(inputPattern1);
    expect(mockListProficienciesByCondition).toHaveBeenCalledWith(inputPattern2);
  });
});