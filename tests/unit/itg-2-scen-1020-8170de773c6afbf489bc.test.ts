import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1020: 実行権限のないユーザーがバッチ処理を実行しようとするとき', () => {
  test('認証が失敗し処理は開始されない', async () => {
    const input = {
      userId: 'user-no-permission',
      password: 'password123',
    };

    let errorThrown: Error | null = null;
    let result = null;

    try {
      result = await authenticateUser(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    // UserAccountInactiveErrorが発生することを検証
    if (errorThrown) {
      expect(errorThrown.name).toBe('UserAccountInactiveError');
      expect(errorThrown.message).toBe('このユーザーアカウントは無効です。');
    } else if (result) {
      // エラーが例外ではなく戻り値で返される場合
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    } else {
      // どちらでもない場合はテスト失敗
      fail('UserAccountInactiveErrorが発生するか、success=falseの戻り値が返されるべき');
    }
  });
});