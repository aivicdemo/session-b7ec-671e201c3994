import { saveUser, SaveUserInput, SaveUserOutput, PersistenceError } from '../../src/logic/persistence-layer';
import * as databaseModule from '../../src/infrastructure/database';
import * as validationModule from '../../src/logic/validation';
import * as authorizationModule from '../../src/logic/authorization';

jest.mock('../../src/infrastructure/database');
jest.mock('../../src/logic/validation');
jest.mock('../../src/logic/authorization');

describe('SCEN-410: ユーザー情報保存時のデータベース接続エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベース接続エラーやトランザクション失敗が発生した場合、ユーザー情報の保存に失敗したというエラーが発生する', async () => {
    // Step 1: validateInputDataとauthorizeUserActionをスタブ化し、両者が正常に完了するよう設定
    (validationModule.validateInputData as jest.Mock).mockResolvedValue(true);
    (authorizationModule.authorizeUserAction as jest.Mock).mockResolvedValue(true);

    // Step 2: データベース接続層をモック化し、トランザクション失敗を発生させるよう設定
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      saveUserRecord: jest.fn().mockRejectedValue(
        new Error('Database connection lost during transaction')
      ),
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (databaseModule.getDatabaseConnection as jest.Mock).mockReturnValue(mockConnection);

    // Step 3: 有効なSaveUserInputを準備
    const input: SaveUserInput = {
      userId: 'U001',
      userName: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: 'Test User',
      role: 'worker',
      siteId: 'S001',
      status: 'active',
      createdBy: 'U000',
      requestingUserId: 'U000',
    };

    // Step 4, 5: saveUser関数を呼び出し、例外をキャッチして検証
    let caughtError: Error | null = null;
    let result: SaveUserOutput | undefined;

    try {
      result = await saveUser(input);
    } catch (e) {
      caughtError = e as Error;
    }

    // 期待結果の検証
    // PersistenceErrorが発生し、エラーメッセージが指定されたメッセージであること
    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(PersistenceError);
    expect(caughtError?.message).toBe('ユーザー情報の保存に失敗しました。');
    expect(result).toBeUndefined();
  });

  it('データベース制約違反エラーが発生した場合、ユーザー情報の保存に失敗したというエラーが発生する', async () => {
    // Step 1: validateInputDataとauthorizeUserActionをスタブ化し、両者が正常に完了するよう設定
    (validationModule.validateInputData as jest.Mock).mockResolvedValue(true);
    (authorizationModule.authorizeUserAction as jest.Mock).mockResolvedValue(true);

    // Step 2: データベース接続層をモック化し、制約違反エラーを発生させるよう設定
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      saveUserRecord: jest.fn().mockRejectedValue(
        new Error('Unique constraint violation: email already exists')
      ),
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (databaseModule.getDatabaseConnection as jest.Mock).mockReturnValue(mockConnection);

    // Step 3: 有効なSaveUserInputを準備
    const input: SaveUserInput = {
      userId: 'U002',
      userName: 'anotheruser',
      email: 'test@example.com',
      passwordHash: 'hash456',
      fullName: 'Another User',
      role: 'worker',
      siteId: 'S001',
      status: 'active',
      createdBy: 'U000',
      requestingUserId: 'U000',
    };

    // Step 4, 5: saveUser関数を呼び出し、例外をキャッチして検証
    let caughtError: Error | null = null;
    let result: SaveUserOutput | undefined;

    try {
      result = await saveUser(input);
    } catch (e) {
      caughtError = e as Error;
    }

    // 期待結果の検証
    // PersistenceErrorが発生し、エラーメッセージが指定されたメッセージであること
    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(PersistenceError);
    expect(caughtError?.message).toBe('ユーザー情報の保存に失敗しました。');
    expect(result).toBeUndefined();
  });
});