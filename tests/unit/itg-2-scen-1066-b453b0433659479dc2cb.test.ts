import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1066: WES・WMSデータ取得失敗時フォールバック', () => {
  describe('authenticateUser', () => {
    it('有効なユーザーID・パスワードで認証し、success: true、有効なUserContext、認証トークン、有効期限を返す', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      
      expect(result.userContext).not.toBeNull();
      expect(result.userContext?.userId).toBe('leader001');
      expect(result.userContext?.userName).toBeDefined();
      expect(result.userContext?.role).toBeDefined();
      expect(result.userContext?.permissions).toBeDefined();
      expect(Array.isArray(result.userContext?.permissions)).toBe(true);
      
      expect(result.authToken).not.toBeNull();
      expect(typeof result.authToken).toBe('string');
      expect(result.authToken!.length).toBeGreaterThan(0);
      
      expect(result.expiresAt).not.toBeNull();
      expect(typeof result.expiresAt).toBe('string');
      // ISO 8601形式のチェック（例：2024-01-15T10:30:00Z）
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(result.expiresAt!)).toBe(true);
      
      // 有効期限が現在時刻より後であることを確認
      const expiresAtTime = new Date(result.expiresAt!).getTime();
      const nowTime = new Date().getTime();
      expect(expiresAtTime).toBeGreaterThan(nowTime);
    });

    it('入力値のユーザーIDが空文字列の場合、success: falseを返す', async () => {
      // Arrange
      const input = {
        userId: '',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('入力値のパスワードがnullの場合、success: falseを返す', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: null as any
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('入力値のユーザーIDが形式不正（特殊文字を含むなど）の場合、success: falseを返す', async () => {
      // Arrange
      const input = {
        userId: 'leader@@@!!!',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('パスワードが空文字列の場合、success: falseを返す', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: ''
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('存在しないユーザーIDの場合、success: falseを返す', async () => {
      // Arrange
      const input = {
        userId: 'nonexistent_user',
        password: 'anyPassword'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('パスワードが間違っている場合、success: falseを返す', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: 'wrongPassword'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBeNull();
      expect(result.authToken).toBeNull();
      expect(result.expiresAt).toBeNull();
    });

    it('返されるUserContextに拠点ID（siteId）が含まれる', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userContext).not.toBeNull();
      expect(result.userContext?.siteId).toBeDefined();
    });

    it('返されるUserContextにチームID（teamId）が含まれる', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userContext).not.toBeNull();
      expect(result.userContext?.teamId).toBeDefined();
    });

    it('認証成功時、返されるUserContextのroleが定義されている', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userContext?.role).toBeTruthy();
      expect(typeof result.userContext?.role).toBe('string');
    });

    it('認証成功時、返されるUserContextのpermissionsが配列である', async () => {
      // Arrange
      const input = {
        userId: 'leader001',
        password: 'validPassword123'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.userContext?.permissions)).toBe(true);
    });
  });
});