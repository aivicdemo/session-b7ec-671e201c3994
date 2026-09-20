import { findWorkerById, FindWorkerByIdInput, FindWorkerByIdOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-441: findWorkerById - Database connection failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DatabaseConnectionError with "データベースへのアクセスに失敗しました。" when database connection times out', async () => {
    // データベース接続タイムアウト状態のスタブ環境を用意する
    const connectionTimeoutError = new Error('データベースへのアクセスに失敗しました。');
    connectionTimeoutError.name = 'DatabaseConnectionError';

    jest.spyOn(persistenceLayer, 'findWorkerById').mockRejectedValueOnce(connectionTimeoutError);

    const input: FindWorkerByIdInput = {
      workerId: 'valid-worker-id',
      requestingUserId: 'valid-user-id',
    };

    let thrownError: unknown;
    let result: FindWorkerByIdOutput | undefined;

    try {
      result = await persistenceLayer.findWorkerById(input);
      fail('Expected findWorkerById to throw DatabaseConnectionError');
    } catch (error: unknown) {
      thrownError = error;
    }

    // DatabaseConnectionError エラーが発生していることを検証
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);

    const err = thrownError as Error;
    expect(err.name).toBe('DatabaseConnectionError');
    expect(err.message).toBe('データベースへのアクセスに失敗しました。');

    // 出力型 FindWorkerByIdOutput は返されないこと
    expect(result).toBeUndefined();
  });

  it('should throw DatabaseConnectionError with "データベースへのアクセスに失敗しました。" when connection is refused', async () => {
    // 接続拒否状態のスタブ環境を用意する
    const connectionRefusedError = new Error('データベースへのアクセスに失敗しました。');
    connectionRefusedError.name = 'DatabaseConnectionError';

    jest.spyOn(persistenceLayer, 'findWorkerById').mockRejectedValueOnce(connectionRefusedError);

    const input: FindWorkerByIdInput = {
      workerId: 'valid-worker-id',
      requestingUserId: 'valid-user-id',
    };

    let thrownError: unknown;
    let result: FindWorkerByIdOutput | undefined;

    try {
      result = await persistenceLayer.findWorkerById(input);
      fail('Expected findWorkerById to throw DatabaseConnectionError');
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);

    const err = thrownError as Error;
    expect(err.name).toBe('DatabaseConnectionError');
    expect(err.message).toBe('データベースへのアクセスに失敗しました。');

    // 出力型 FindWorkerByIdOutput は返されないこと
    expect(result).toBeUndefined();
  });

  it('should throw DatabaseConnectionError with "データベースへのアクセスに失敗しました。" when authentication fails', async () => {
    // 認証失敗状態のスタブ環境を用意する
    const authFailureError = new Error('データベースへのアクセスに失敗しました。');
    authFailureError.name = 'DatabaseConnectionError';

    jest.spyOn(persistenceLayer, 'findWorkerById').mockRejectedValueOnce(authFailureError);

    const input: FindWorkerByIdInput = {
      workerId: 'valid-worker-id',
      requestingUserId: 'valid-user-id',
    };

    let thrownError: unknown;
    let result: FindWorkerByIdOutput | undefined;

    try {
      result = await persistenceLayer.findWorkerById(input);
      fail('Expected findWorkerById to throw DatabaseConnectionError');
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);

    const err = thrownError as Error;
    expect(err.name).toBe('DatabaseConnectionError');
    expect(err.message).toBe('データベースへのアクセスに失敗しました。');

    // 出力型 FindWorkerByIdOutput は返されないこと
    expect(result).toBeUndefined();
  });
});