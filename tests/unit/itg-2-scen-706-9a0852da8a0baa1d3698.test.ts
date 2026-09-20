import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-706: authenticateUser正常系', () => {
  it('有効なユーザーIDとパスワードで認証されて、ユーザーコンテキストと認証トークンが返される', async () => {
    // Arrange
    const userId = 'user123';
    const password = 'testPass2025';

    // Act
    const result = await authenticateUser({
      userId,
      password,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext?.userId).toBe(userId);
    expect(result.userContext?.role).toBeTruthy();
    expect(typeof result.userContext?.role).toBe('string');
    expect(result.userContext?.siteId).toBeDefined();
    expect(result.userContext?.teamId).toBeDefined();
    expect(Array.isArray(result.userContext?.permissions)).toBe(true);
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});