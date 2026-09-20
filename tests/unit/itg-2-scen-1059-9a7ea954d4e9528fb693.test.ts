import { authenticateUser } from '../../src/logic/authorization-and-validation';
import * as authRepo from '../../src/repositories/auth-repository';

jest.mock('../../src/repositories/auth-repository');

describe('SCEN-1059: authenticateUser - 認証成功時に正しいユーザーコンテキストとトークンを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate user successfully with valid credentials', async () => {
    const input = {
      userId: 'user001',
      password: 'password123'
    };

    const mockUserData = {
      userId: 'user001',
      userName: 'Test User',
      role: 'worker',
      siteId: 'site001',
      teamId: 'team001',
      permissions: ['view_productivity_data', 'create_work_instruction'],
      passwordHash: '$2b$10$hashedpassword123',
      status: 'active'
    };

    const tokenExpiresAt = new Date(Date.now() + 3600000).toISOString();

    (authRepo.findUserByUserId as jest.Mock).mockResolvedValue(mockUserData);
    (authRepo.verifyPasswordHash as jest.Mock).mockResolvedValue(true);
    (authRepo.generateAuthToken as jest.Mock).mockResolvedValue({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMDAxIn0.test',
      expiresAt: tokenExpiresAt
    });

    const result = await authenticateUser(input);

    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext?.userId).toBe('user001');
    expect(result.userContext?.userName).toBe('Test User');
    expect(result.userContext?.role).toBe('worker');
    expect(result.userContext?.siteId).toBe('site001');
    expect(result.userContext?.teamId).toBe('team001');
    expect(result.userContext?.permissions).toBeDefined();
    expect(Array.isArray(result.userContext?.permissions)).toBe(true);
    expect(result.userContext?.permissions).toContain('view_productivity_data');
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken!.length).toBeGreaterThan(0);
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    
    const expirationDate = new Date(result.expiresAt!);
    expect(expirationDate.toISOString()).toBe(result.expiresAt);
    expect(expirationDate.getTime()).toBeGreaterThan(Date.now());

    expect(authRepo.findUserByUserId).toHaveBeenCalledWith('user001');
    expect(authRepo.verifyPasswordHash).toHaveBeenCalledWith('password123', mockUserData.passwordHash);
    expect(authRepo.generateAuthToken).toHaveBeenCalledWith('user001');
  });
});