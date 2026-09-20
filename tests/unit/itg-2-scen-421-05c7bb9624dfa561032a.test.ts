import { findUserById, FindUserByIdInput, FindUserByIdOutput } from '../../src/logic/persistence-layer';

describe('SCEN-421: findUserById - lastLoginDateTime is null for first-time login users', () => {
  it('should return user record with lastLoginDateTime as null for user who has never logged in', async () => {
    // Arrange
    const input: FindUserByIdInput = {
      userId: 'user-never-logged-in',
      requestingUserId: 'admin-user'
    };

    // Act
    const result: FindUserByIdOutput = await findUserById(input);

    // Assert
    expect(result.userId).toBe('user-never-logged-in');
    expect(result.userName).toBeTruthy();
    expect(typeof result.userName).toBe('string');
    expect(result.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(result.fullName).toBeTruthy();
    expect(typeof result.fullName).toBe('string');
    expect(['作業者', '管理者', 'システム管理者', 'チームリーダー', 'active', 'inactive', 'suspended']).toContain(result.role);
    expect(result.siteId === null || typeof result.siteId === 'string').toBe(true);
    expect(result.teamId === null || typeof result.teamId === 'string').toBe(true);
    expect(['active', 'inactive', 'suspended']).toContain(result.status);
    expect(result.lastLoginDateTime).toBeNull();
    expect(result.found).toBe(true);
  });
});