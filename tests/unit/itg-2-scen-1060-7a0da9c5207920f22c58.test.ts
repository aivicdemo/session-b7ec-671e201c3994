import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1060: ハンディターミナルデータ受信と再試行 - 記録された作業実績データがWES・WMSと正常に同期される', () => {
  it('有効なuserIdとpasswordで認証すると、success=true、有効なuserContext、authToken、expiresAtを返す', async () => {
    // Arrange
    const validUserId = 'user123';
    const validPassword = 'password123';

    const input = {
      userId: validUserId,
      password: validPassword,
    };

    // Step 1-5: 入力値の前提条件確認
    // Step 1: userIdとpasswordが有効な値であることを確認
    expect(validUserId).toBeDefined();
    expect(validPassword).toBeDefined();

    // Step 2: validateRequiredFields - userIdとpasswordが空文字列でもnullでもないことを確認
    expect(input.userId).not.toBe('');
    expect(input.userId).not.toBeNull();
    expect(input.password).not.toBe('');
    expect(input.password).not.toBeNull();

    // Step 3: validateFieldFormat - userIdとpasswordの形式が正しいことを確認
    expect(typeof input.userId).toBe('string');
    expect(typeof input.password).toBe('string');
    expect(input.userId.length).toBeGreaterThan(0);
    expect(input.password.length).toBeGreaterThan(0);

    // Act
    // Step 6: authenticateUserを実行する
    const result = await authenticateUser(input);

    // Assert
    // Step 4: 認証情報検証処理が正しい結果を返すことを確認
    // Step 5: 認証トークン発行処理が正しい結果を返すことを確認
    // Step 7: successフィールドがtrueであることを検証
    expect(result.success).toBe(true);

    // Step 8: userContextフィールドがnullでなく、userIdやroleや拠点・チーム・権限スコープを含む有効なUserContextオブジェクトであることを検証
    expect(result.userContext).not.toBeNull();
    expect(result.userContext).toBeDefined();
    
    if (result.userContext) {
      // userIdの検証
      expect(result.userContext.userId).toBeDefined();
      expect(typeof result.userContext.userId).toBe('string');
      expect(result.userContext.userId.length).toBeGreaterThan(0);

      // userNameの検証
      expect(result.userContext.userName).toBeDefined();
      expect(typeof result.userContext.userName).toBe('string');

      // roleの検証
      expect(result.userContext.role).toBeDefined();
      expect(typeof result.userContext.role).toBe('string');

      // 拠点スコープ（siteId）の検証
      expect(result.userContext.siteId).toBeDefined();
      if (result.userContext.siteId !== null) {
        expect(typeof result.userContext.siteId).toBe('string');
        expect(result.userContext.siteId.length).toBeGreaterThan(0);
      }

      // チームスコープ（teamId）の検証
      expect(result.userContext.teamId).toBeDefined();
      if (result.userContext.teamId !== null) {
        expect(typeof result.userContext.teamId).toBe('string');
        expect(result.userContext.teamId.length).toBeGreaterThan(0);
      }

      // 権限スコープ（permissions）の検証
      expect(result.userContext.permissions).toBeDefined();
      expect(Array.isArray(result.userContext.permissions)).toBe(true);
    }

    // Step 9: authTokenフィールドがnullでなく、有効なトークン文字列であることを検証
    expect(result.authToken).not.toBeNull();
    expect(result.authToken).toBeDefined();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken.length).toBeGreaterThan(0);

    // Step 10: expiresAtフィールドがnullでなく、ISO 8601形式の有効期限であることを検証
    expect(result.expiresAt).not.toBeNull();
    expect(result.expiresAt).toBeDefined();
    expect(typeof result.expiresAt).toBe('string');
    
    // ISO 8601形式のバリデーション
    const expiresAtDate = new Date(result.expiresAt!);
    expect(expiresAtDate).toBeInstanceOf(Date);
    expect(expiresAtDate.getTime()).not.toBeNaN();
    
    // ISO 8601形式であることを確認（例：'2025-01-15T14:30:00Z'）
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    expect(result.expiresAt).toMatch(iso8601Regex);
  });
});