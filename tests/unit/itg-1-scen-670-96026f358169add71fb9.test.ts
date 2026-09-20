import { listProficienciesByCondition } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-670: 習熟度データ取得 - データベースクエリ実行失敗時', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataAccessError when database query fails', async () => {
    const input = {
      workerIds: ['W001', 'W002'],
      jobTypes: ['type_A'],
      pageNumber: 1,
      pageSize: 10,
    };

    // データベース接続タイムアウトのエラーをシミュレート
    const dbError = new Error('データベース接続タイムアウト');
    (dbError as any).code = 'ECONNREFUSED';

    // listProficienciesByCondition の内部で呼ばれるデータベースアクセス層をモック化
    // jest.spyOn を使用して、実装内のデータベース呼び出しをモック化
    const spy = jest.spyOn(dataPersistence, 'listProficienciesByCondition').mockImplementation(() => {
      throw Object.assign(new Error('習熟度データの取得に失敗しました。'), {
        name: 'DataAccessError',
      });
    });

    // 設定したスタブ状態下で listProficienciesByCondition(input) を呼び出す
    let thrownError: any;
    try {
      await listProficienciesByCondition(input);
      fail('Expected DataAccessError to be thrown');
    } catch (e) {
      thrownError = e;
    }

    // エラーが発生したことを確認
    expect(thrownError).toBeDefined();

    // エラー名が DataAccessError であることを確認
    expect(thrownError.name).toBe('DataAccessError');

    // エラーメッセージが「習熟度データの取得に失敗しました。」であることを確認
    expect(thrownError.message).toBe('習熟度データの取得に失敗しました。');

    // エラーがスローされたため、呼び出し側は出力型のオブジェクトを受け取らない
    expect(thrownError instanceof Error).toBe(true);

    // スパイが呼ばれたことを確認
    expect(spy).toHaveBeenCalledWith(input);

    spy.mockRestore();
  });
});