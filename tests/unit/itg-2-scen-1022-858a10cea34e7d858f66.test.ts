import { authenticateUser, AuthenticateUserInput, AuthenticateUserOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1022: バッチ実行遅延時の警告通知', () => {
  it('有効なユーザーIDと正しいパスワードで認証できる', async () => {
    // Arrange
    const input: AuthenticateUserInput = {
      userId: 'valid-user-id',
      password: 'correct-password'
    };

    // Act
    const result: AuthenticateUserOutput = await authenticateUser(input);

    // Assert
    expect(result.success).toBe(true);
    
    expect(result.userContext).not.toBeNull();
    expect(result.userContext).toBeDefined();
    
    if (result.userContext !== null) {
      expect(result.userContext.userId).toBeDefined();
      expect(typeof result.userContext.userId).toBe('string');
      expect(result.userContext.userId.length).toBeGreaterThan(0);
      
      expect(result.userContext.userName).toBeDefined();
      expect(typeof result.userContext.userName).toBe('string');
      
      expect(result.userContext.role).toBeDefined();
      expect(typeof result.userContext.role).toBe('string');
      expect(result.userContext.role.length).toBeGreaterThan(0);
      
      expect(result.userContext.siteId).toBeDefined();
      
      expect(result.userContext.teamId).toBeDefined();
      
      expect(Array.isArray(result.userContext.permissions)).toBe(true);
    }
    
    expect(result.authToken).not.toBeNull();
    expect(result.authToken).toBeDefined();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken.length).toBeGreaterThan(0);
    
    expect(result.expiresAt).not.toBeNull();
    expect(result.expiresAt).toBeDefined();
    expect(typeof result.expiresAt).toBe('string');
    
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.expiresAt).toMatch(iso8601Pattern);
    
    const expiresDate = new Date(result.expiresAt);
    expect(expiresDate.getTime()).toBeGreaterThan(Date.now());
  });
});