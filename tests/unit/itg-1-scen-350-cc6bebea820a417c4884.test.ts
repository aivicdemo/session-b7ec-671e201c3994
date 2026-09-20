import { authenticateUser } from '../../src/logic/auth-authorization-audit';
import { AuthenticateUserInput, UserAuthData } from '../../src/logic/auth-authorization-audit';
import * as crypto from 'crypto';

describe('SCEN-350: 拠点に限定されないロールのユーザーが認証された場合、出力のfacilityIdはnullである', () => {
  it('should return null facilityId when system administrator is authenticated', async () => {
    // Arrange
    const plainPassword = 'TestPassword123!';
    const passwordHash = crypto.createHash('sha256').update(plainPassword).digest('hex');

    const userAuthData: UserAuthData = {
      userId: 'user001',
      userName: 'System Admin',
      passwordHash: passwordHash,
      status: 'active',
      role: 'システム管理者',
      facilityId: null,
      teamId: null,
    };

    const input: AuthenticateUserInput = {
      userId: 'user001',
      passwordPlaintext: plainPassword,
      ipAddress: '192.168.1.100',
      userAuthData: userAuthData,
    };

    // Act
    const result = await authenticateUser(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.facilityId).toBeNull();
    expect(result.sessionToken).toBeDefined();
    expect(result.userId).toBe('user001');
    expect(result.userName).toBe('System Admin');
    expect(result.role).toBe('システム管理者');
    expect(result.teamId).toBeNull();
    expect(result.sessionExpiresAt).toBeDefined();
    
    // Verify sessionExpiresAt is ISO 8601 format
    const expirationDate = new Date(result.sessionExpiresAt);
    expect(expirationDate.toISOString()).toBe(result.sessionExpiresAt);
  });

  it('should return valid session token with proper ISO 8601 expiration time', async () => {
    // Arrange
    const plainPassword = 'SecurePass456@';
    const passwordHash = crypto.createHash('sha256').update(plainPassword).digest('hex');

    const userAuthData: UserAuthData = {
      userId: 'admin_user',
      userName: 'Admin Name',
      passwordHash: passwordHash,
      status: 'active',
      role: 'システム管理者',
      facilityId: null,
      teamId: null,
    };

    const input: AuthenticateUserInput = {
      userId: 'admin_user',
      passwordPlaintext: plainPassword,
      ipAddress: '10.0.0.1',
      userAuthData: userAuthData,
    };

    // Act
    const result = await authenticateUser(input);

    // Assert
    expect(result.sessionToken).toBeTruthy();
    expect(typeof result.sessionToken).toBe('string');
    expect(result.sessionToken.length).toBeGreaterThan(0);
    
    // Verify all required fields are present
    expect(result.userId).toBe('admin_user');
    expect(result.userName).toBe('Admin Name');
    expect(result.role).toBe('システム管理者');
    expect(result.facilityId).toBeNull();
    expect(result.teamId).toBeNull();
    
    // Verify expiration is in the future
    const expirationTime = new Date(result.sessionExpiresAt).getTime();
    const currentTime = new Date().getTime();
    expect(expirationTime).toBeGreaterThan(currentTime);
  });
});