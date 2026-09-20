import { authenticateUser } from '../../src/logic/authorization-and-validation';
import { AuthenticateUserInput, AuthenticateUserOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1081: 作業開始記録が現場リーダーのダッシュボードに反映されたとき、進捗監視の可視化が実現される', () => {
  it('現場リーダーの認証が成功し、ダッシュボードアクセス権限が付与される', async () => {
    // Arrange: 現場リーダーのユーザーID・パスワードを準備
    const genkiLeaderUserId = 'leader-genki-001';
    const genkiLeaderPassword = 'validPassword123';

    const input: AuthenticateUserInput = {
      userId: genkiLeaderUserId,
      password: genkiLeaderPassword,
    };

    // Act: authenticateUser関数を呼び出し
    const result: AuthenticateUserOutput = await authenticateUser(input);

    // Assert: 認証が成功したことを確認
    expect(result.success).toBe(true);

    // Assert: userContextが返却され、現場リーダーの情報が格納されていること
    expect(result.userContext).not.toBeNull();
    if (result.userContext) {
      expect(result.userContext.userId).toBe(genkiLeaderUserId);
      expect(result.userContext.role).toBe('現場リーダー');
      expect(result.userContext.siteId).not.toBeNull();
      expect(result.userContext.teamId).not.toBeNull();
      expect(result.userContext.permissions).toBeInstanceOf(Array);
      expect(result.userContext.permissions.length).toBeGreaterThan(0);
    }

    // Assert: 有効な認証トークンが発行されていること
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken!.length).toBeGreaterThan(0);

    // Assert: トークン有効期限がISO 8601形式で返却されていること
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    // ISO 8601形式の検証（例：2024-01-15T12:34:56Z）
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(result.expiresAt!).toMatch(iso8601Regex);

    // Assert: 有効期限が現在時刻より後であること
    const expiresAtTime = new Date(result.expiresAt!).getTime();
    const nowTime = new Date().getTime();
    expect(expiresAtTime).toBeGreaterThan(nowTime);
  });
});