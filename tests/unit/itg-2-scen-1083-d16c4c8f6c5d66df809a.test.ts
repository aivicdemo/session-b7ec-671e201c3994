import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1083: 作業指示受領記録APIの認証', () => {
  test('有効なセッションを持つユーザーが認証に成功する', async () => {
    // Arrange
    const userId = 'user001';
    const password = 'validPassword123';

    // Act
    const result = await authenticateUser({
      userId,
      password,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    if (result.userContext) {
      expect(result.userContext.userId).toBeTruthy();
      expect(result.userContext.role).toBeTruthy();
      expect(result.userContext.siteId).toBeTruthy();
      expect(result.userContext.teamId).toBeTruthy();
      expect(result.userContext.permissions).toBeDefined();
      expect(Array.isArray(result.userContext.permissions)).toBe(true);
    }
    expect(result.authToken).not.toBeNull();
    expect(result.authToken).toBeTruthy();
    expect(result.expiresAt).not.toBeNull();
    expect(result.expiresAt).toBeTruthy();
    // Validate ISO 8601 format
    const expiresAtDate = new Date(result.expiresAt!);
    expect(isNaN(expiresAtDate.getTime())).toBe(false);
  });
});