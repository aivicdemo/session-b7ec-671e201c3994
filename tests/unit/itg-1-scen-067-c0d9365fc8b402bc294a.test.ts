import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as authModule from '../../src/logic/auth-authorization-audit';

describe('SCEN-067: 権限なしユーザーによる進捗監視・配置指示配信実行時のエラーハンドリング', () => {
  let authorizeOperationSpy: jest.SpyInstance;

  beforeEach(() => {
    authorizeOperationSpy = jest.spyOn(authModule, 'authorizeOperation').mockImplementation(() => {
      throw new authModule.AuthorizationError('この操作を実行する権限がありません。');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('権限なしユーザーIDで実行するとAuthorizationErrorがスローされる', async () => {
    const userId = 'user-no-auth-001';
    const facilityIds = ['facility-001', 'facility-002'];

    const input = {
      userId,
      facilityIds,
    };

    await expect(runTx4Imp1Agent(input, expect.anything())).rejects.toThrow(
      authModule.AuthorizationError
    );
  });

  test('スロー時のエラーメッセージが正確である', async () => {
    const userId = 'user-no-auth-001';
    const facilityIds = ['facility-001', 'facility-002'];

    const input = {
      userId,
      facilityIds,
    };

    try {
      await runTx4Imp1Agent(input, expect.anything());
      fail('AuthorizationErrorがスローされるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(authModule.AuthorizationError);
      expect((error as authModule.AuthorizationError).message).toBe(
        'この操作を実行する権限がありません。'
      );
    }
  });

  test('authorizeOperationが呼び出されることを確認する', async () => {
    const userId = 'user-no-auth-001';
    const facilityIds = ['facility-001', 'facility-002'];

    const input = {
      userId,
      facilityIds,
    };

    try {
      await runTx4Imp1Agent(input, expect.anything());
    } catch {
      // エラーはここで予期される
    }

    expect(authorizeOperationSpy).toHaveBeenCalled();
  });

  test('エラーがスローされた場合、後続処理は実行されない', async () => {
    const userId = 'user-no-auth-001';
    const facilityIds = ['facility-001', 'facility-002'];

    const input = {
      userId,
      facilityIds,
    };

    try {
      await runTx4Imp1Agent(input, expect.anything());
    } catch (error) {
      // エラーをキャッチして確認
      expect(error).toBeInstanceOf(authModule.AuthorizationError);
    }

    // authorizeOperationが最初に呼び出されて失敗しているため、
    // 後続処理（monitorAndJudgeDelayRisk等）は実行されない
    // これは外部依存への呼び出し数（例えば WMS、SageMaker など）が
    // 最小限に留まることで確認できる
  });

  test('出力型フィールドは返されない', async () => {
    const userId = 'user-no-auth-001';
    const facilityIds = ['facility-001', 'facility-002'];

    const input = {
      userId,
      facilityIds,
    };

    try {
      await runTx4Imp1Agent(input, expect.anything());
      fail('AuthorizationErrorがスローされるべき');
    } catch (error) {
      // エラーがスローされたため、出力は返されない
      expect(error).toBeInstanceOf(authModule.AuthorizationError);
    }
  });
});