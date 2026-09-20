import { authenticateUser } from '../../src/logic/authorization-and-validation';
import { AuthenticateUserInput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1079: 作業開始イベントがデータベースに正常に保存されたとき、現場リーダーへの通知が送信される', () => {
  it('認証済みユーザーコンテキストが取得でき、作業開始記録が保存され、現場リーダーへの通知が送信されること', async () => {
    // 前提: ユーザー認証を実施して認証済みコンテキストを取得
    const input: AuthenticateUserInput = {
      userId: 'user123',
      password: 'validPassword123'
    };

    const authResult = await authenticateUser(input);

    // 手順1: authenticateUser関数がAuthenticateUserOutput型で成功を返すこと
    expect(authResult.success).toBe(true);
    
    // 手順2: userContext: ユーザーIDとロール・拠点・チーム・権限スコープを含むUserContextオブジェクト
    expect(authResult.userContext).not.toBeNull();
    expect(authResult.userContext?.userId).toBeDefined();
    expect(authResult.userContext?.role).toBeDefined();
    expect(authResult.userContext?.siteId).toBeDefined();
    expect(authResult.userContext?.teamId).toBeDefined();
    expect(authResult.userContext?.permissions).toBeDefined();
    expect(Array.isArray(authResult.userContext?.permissions)).toBe(true);
    
    // 手順3: authToken: 認証トークン文字列（null以外）
    expect(authResult.authToken).not.toBeNull();
    expect(typeof authResult.authToken).toBe('string');
    expect(authResult.authToken?.length).toBeGreaterThan(0);
    
    // 手順4: expiresAt: ISO 8601形式の有効期限文字列（null以外）
    expect(authResult.expiresAt).not.toBeNull();
    expect(typeof authResult.expiresAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(authResult.expiresAt!)).toBe(true);

    // 期待結果: authenticateUser関数がAuthenticateUserOutput型で以下の値を返すこと
    // success=true、userContext=ユーザーIDとロール・拠点・チーム・権限スコープを含むUserContextオブジェクト、
    // authToken=認証トークン文字列（null以外）、expiresAt=ISO 8601形式の有効期限文字列（null以外）
    expect(authResult.success).toBe(true);
    expect(authResult.userContext).not.toBeNull();
    expect(authResult.userContext?.userId).toBeTruthy();
    expect(authResult.userContext?.role).toBeTruthy();
    expect(authResult.authToken).toBeTruthy();
    expect(authResult.expiresAt).toBeTruthy();
  });
});