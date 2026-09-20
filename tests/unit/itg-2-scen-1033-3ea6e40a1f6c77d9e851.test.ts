import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1033: authenticateUser - 有効なユーザー認証', () => {
  it('有効な認証情報でユーザー認証に成功し、認証コンテキストとトークンを返す', async () => {
    const input = {
      userId: 'user001',
      password: 'validPassword123',
    };

    const output = await authenticateUser(input);

    expect(output.success).toBe(true);
    expect(output.userContext).not.toBeNull();
    expect(output.userContext).toBeDefined();
    if (output.userContext) {
      expect(output.userContext.userId).toBeDefined();
      expect(typeof output.userContext.userId).toBe('string');
      expect(output.userContext.userName).toBeDefined();
      expect(typeof output.userContext.userName).toBe('string');
      expect(output.userContext.role).toBeDefined();
      expect(typeof output.userContext.role).toBe('string');
      expect(output.userContext.siteId).toBeDefined();
      expect(output.userContext.teamId).toBeDefined();
      expect(Array.isArray(output.userContext.permissions)).toBe(true);
    }
    expect(output.authToken).not.toBeNull();
    expect(typeof output.authToken).toBe('string');
    expect(output.expiresAt).not.toBeNull();
    const expiresAtDate = new Date(output.expiresAt!);
    expect(expiresAtDate).toBeInstanceOf(Date);
    expect(expiresAtDate.toString()).not.toBe('Invalid Date');
  });
});