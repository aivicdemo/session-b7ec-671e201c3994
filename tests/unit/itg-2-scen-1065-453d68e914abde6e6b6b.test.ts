import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1065: WES・WMSデータ取得失敗時フォールバック', () => {
  describe('authenticateUserを呼び出す', () => {
    it('userId=leader001でauthenticateUserを呼び出し、success=trueを返し、userContext・authToken・expiresAtを正常に返す', async () => {
      // Arrange
      const userId = 'leader001';
      const password = 'validPassword123';

      // Act
      const result = await authenticateUser({
        userId,
        password,
      });

      // Assert
      expect(result.success).toBe(true);
      
      expect(result.userContext).not.toBeNull();
      expect(result.userContext).toBeDefined();
      expect(result.userContext?.userId).toBe(userId);
      expect(result.userContext?.userName).toBeDefined();
      expect(typeof result.userContext?.userName).toBe('string');
      expect(result.userContext?.role).toBeDefined();
      expect(typeof result.userContext?.role).toBe('string');
      expect(result.userContext?.siteId).toBeDefined();
      expect(result.userContext?.teamId).toBeDefined();
      expect(result.userContext?.permissions).toBeDefined();
      expect(Array.isArray(result.userContext?.permissions)).toBe(true);

      expect(result.authToken).not.toBeNull();
      expect(typeof result.authToken).toBe('string');
      expect(result.authToken?.length).toBeGreaterThan(0);

      expect(result.expiresAt).not.toBeNull();
      expect(typeof result.expiresAt).toBe('string');
      expect(() => new Date(result.expiresAt!)).not.toThrow();
    });
  });
});