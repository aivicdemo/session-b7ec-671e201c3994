import { authenticateUser } from '../../src/logic/auth-authorization-audit';

describe('SCEN-351: チームに限定されないロールのユーザーが認証された場合、出力のteamIdはnullである', () => {
  it('should return null teamId for admin role user without team assignment', async () => {
    // Arrange
    const userId = 'user-001';
    const facilityId = 'facility-A';
    const userName = 'Admin User';
    const passwordPlaintext = 'plaintext-password-123';
    const passwordHash = await hashPassword(passwordPlaintext);
    const ipAddress = '192.168.1.100';

    const userAuthData = {
      userId: userId,
      userName: userName,
      passwordHash: passwordHash,
      status: 'active',
      role: 'admin',
      facilityId: facilityId,
      teamId: null,
    };

    const input = {
      userId: userId,
      passwordPlaintext: passwordPlaintext,
      ipAddress: ipAddress,
      userAuthData: userAuthData,
    };

    // Act
    const output = await authenticateUser(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.sessionToken).toBeTruthy();
    expect(typeof output.sessionToken).toBe('string');
    expect(output.userId).toBe('user-001');
    expect(output.userName).toBe(userName);
    expect(output.role).toBe('admin');
    expect(output.facilityId).toBe('facility-A');
    expect(output.teamId).toBeNull();
    expect(output.sessionExpiresAt).toBeTruthy();
    expect(typeof output.sessionExpiresAt).toBe('string');
    expect(isValidISO8601(output.sessionExpiresAt)).toBe(true);
  });
});

// Helper functions
async function hashPassword(password: string): Promise<string> {
  // Mock hash function - in real implementation would use bcrypt or similar
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isValidISO8601(dateString: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!iso8601Regex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}