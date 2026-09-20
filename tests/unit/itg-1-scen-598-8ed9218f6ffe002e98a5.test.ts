import { getWorkerById, GetWorkerByIdInput } from '../../src/logic/data-persistence';

// モック用のデータベースモジュール
jest.mock('../../src/logic/db-connection', () => ({
  executeQuery: jest.fn(),
}));

describe('SCEN-598: getWorkerById - DatabaseAccessError on query execution failure', () => {
  let executeQueryMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // db-connection モジュールからモック関数を取得
    const dbConnectionModule = require('../../src/logic/db-connection');
    executeQueryMock = dbConnectionModule.executeQuery;
  });

  it('should throw DatabaseAccessError with specific message when database connection fails', () => {
    const workerId = 'W001';
    const input: GetWorkerByIdInput = { workerId };

    // テスト前提: データベース接続層をモック化し、接続障害をシミュレートするように設定する
    const connectionError = new Error('Connection refused');
    executeQueryMock.mockImplementationOnce(() => {
      throw connectionError;
    });

    // 入力値 workerId に有効な文字列を指定して getWorkerById(input) を呼び出す
    expect(() => getWorkerById(input)).toThrow();

    // 関数から返される値またはスローされる例外を検証する
    try {
      getWorkerById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('作業者マスタの検索に失敗しました。');
    }

    expect(executeQueryMock).toHaveBeenCalled();
  });

  it('should throw DatabaseAccessError when SQL execution error occurs', () => {
    const workerId = 'W002';
    const input: GetWorkerByIdInput = { workerId };

    // テスト前提: SQL 実行エラーをシミュレートするように設定する
    const sqlError = new Error('SQL syntax error');
    executeQueryMock.mockImplementationOnce(() => {
      throw sqlError;
    });

    // 入力値 workerId に有効な文字列を指定して getWorkerById(input) を呼び出す
    try {
      getWorkerById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('作業者マスタの検索に失敗しました。');
    }

    expect(executeQueryMock).toHaveBeenCalled();
  });

  it('should throw DatabaseAccessError with correct message on connection failure', () => {
    const workerId = 'W003';
    const input: GetWorkerByIdInput = { workerId };

    // テスト前提: クエリ実行エラーをシミュレートするように設定する
    const connectionFailureError = new Error('Database connection timeout');
    executeQueryMock.mockImplementationOnce(() => {
      throw connectionFailureError;
    });

    // 入力値 workerId に有効な文字列を指定して getWorkerById(input) を呼び出す
    try {
      getWorkerById(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('作業者マスタの検索に失敗しました。');
    }

    expect(executeQueryMock).toHaveBeenCalled();
  });
});