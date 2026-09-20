import { authenticateUser, AuthenticateUserInput, AuthenticateUserOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1026: authenticateUser - valid credentials', () => {
  it('should return success with valid userContext, authToken, and expiresAt when valid credentials are provided', async () => {
    // Arrange
    const input: AuthenticateUserInput = {
      userId: 'user-123',
      password: 'validPassword123'
    };

    // Act
    const result: AuthenticateUserOutput = await authenticateUser(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext).toBeDefined();
    
    if (result.userContext) {
      expect(result.userContext.userId).toBeDefined();
      expect(typeof result.userContext.userId).toBe('string');
      expect(result.userContext.userName).toBeDefined();
      expect(typeof result.userContext.userName).toBe('string');
      expect(result.userContext.role).toBeDefined();
      expect(typeof result.userContext.role).toBe('string');
      expect(result.userContext.siteId).toBeDefined();
      expect(result.userContext.teamId).toBeDefined();
      expect(Array.isArray(result.userContext.permissions)).toBe(true);
    }

    expect(result.authToken).not.toBeNull();
    expect(result.authToken).toBeDefined();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken!.length).toBeGreaterThan(0);

    expect(result.expiresAt).not.toBeNull();
    expect(result.expiresAt).toBeDefined();
    expect(typeof result.expiresAt).toBe('string');
    
    // Verify ISO 8601 format
    const expiresAtDate = new Date(result.expiresAt!);
    expect(expiresAtDate.toString()).not.toBe('Invalid Date');
    expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});