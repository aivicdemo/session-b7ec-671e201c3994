import { listWorkResultsByCondition, ListWorkResultsByConditionInput } from '../../src/logic/data-persistence';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

// データベース層のモック化
jest.mock('../../src/infrastructure/database', () => ({
  executeQuery: jest.fn()
}));

describe('SCEN-751: トランザクション障害発生時にデータアクセスエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベース接続エラー時に DataAccessError が発生する', async () => {
    // トランザクション障害をシミュレートするため、データベース接続がエラーを返すようにモックを設定
    const dbConnectionError = new Error('Connection refused');
    (dbConnectionError as any).code = 'ECONNREFUSED';

    // データベース層のモックを取得して接続エラーを返すよう設定
    const database = require('../../src/infrastructure/database');
    database.executeQuery.mockRejectedValueOnce(dbConnectionError);

    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['completed'],
      pageNumber: 1,
      pageSize: 50
    };

    // listWorkResultsByCondition 処理を呼び出し、エラーが発生することを確認する
    try {
      await listWorkResultsByCondition(input);
      fail('エラーが発生するはずです');
    } catch (error: any) {
      // 期待結果：DataAccessError が発生し、エラー文言「作業実績データの取得に失敗しました。」が返される
      expect(error).toBeDefined();
      expect(error.name).toBe('DataAccessError');
      expect(error.message).toBe('作業実績データの取得に失敗しました。');
    }
  });

  it('クエリ実行時に接続失敗エラーが発生する', async () => {
    // データベースクエリ実行時に接続失敗エラーが発生するよう、スタブを構成する
    const queryTimeoutError = new Error('Query timeout');
    (queryTimeoutError as any).code = 'QUERY_TIMEOUT';

    // データベース層のモックを取得してクエリ実行時にタイムアウトエラーを返すよう設定
    const database = require('../../src/infrastructure/database');
    database.executeQuery.mockRejectedValueOnce(queryTimeoutError);

    const input: ListWorkResultsByConditionInput = {
      workerIds: ['W001'],
      facilityIds: ['F001'],
      workStatuses: ['completed'],
      pageNumber: 1,
      pageSize: 50
    };

    // listWorkResultsByCondition 処理を呼び出し、処理が例外またはエラーレスポンスで終了することを確認する
    try {
      await listWorkResultsByCondition(input);
      fail('エラーが発生するはずです');
    } catch (error: any) {
      // 期待結果：DataAccessError が発生し、エラー文言「作業実績データの取得に失敗しました。」が返される
      expect(error).toBeDefined();
      expect(error.name).toBe('DataAccessError');
      expect(error.message).toBe('作業実績データの取得に失敗しました。');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});