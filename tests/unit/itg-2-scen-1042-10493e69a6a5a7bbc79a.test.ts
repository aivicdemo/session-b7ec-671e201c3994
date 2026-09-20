import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1042: 分析結果の妥当性スコアが70以上のとき、物流センター長に承認推奨として通知される', () => {
  it('authenticateUser関数が正当なユーザーID・パスワードで呼び出されたとき、success:true、有効なauthToken、ISO 8601形式のexpiresAt、userContextを返す', async () => {
    // Arrange
    const userId = 'user001';
    const password = 'validPassword123';

    // Act
    const result = await authenticateUser({
      userId,
      password,
    });

    // Assert - success フィールドがtrueであることを確認
    expect(result.success).toBe(true);

    // Assert - authTokenフィールドがnullでなく、文字列形式であることを確認
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken?.length).toBeGreaterThan(0);

    // Assert - expiresAtフィールドがISO 8601形式の日時文字列であることを確認
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    // ISO 8601形式の検証（例：2024-12-31T23:59:59Z）
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.expiresAt).toMatch(iso8601Regex);
    // expiresAtが現在時刻より後であることを確認
    expect(new Date(result.expiresAt!).getTime()).toBeGreaterThan(new Date().getTime());

    // Assert - userContextフィールドがnullでないことを確認
    expect(result.userContext).not.toBeNull();

    // Assert - userContextのuserIdが'user001'であることを確認
    expect(result.userContext?.userId).toBe('user001');

    // Assert - userContextの役割が'物流センター長'であることを確認
    expect(result.userContext?.role).toBe('物流センター長');

    // Assert - userContextのその他のフィールドが適切に設定されていることを確認
    expect(result.userContext?.userName).toBeDefined();
    expect(typeof result.userContext?.userName).toBe('string');
    expect(result.userContext?.permissions).toBeDefined();
    expect(Array.isArray(result.userContext?.permissions)).toBe(true);

    // Assert - userContextがuserid:'user001'と役割:'物流センター長'を含むことで、認証済みユーザーコンテキストが確立されることを確認
    expect(result.userContext?.userId).toBe('user001');
    expect(result.userContext?.role).toBe('物流センター長');
  });
});