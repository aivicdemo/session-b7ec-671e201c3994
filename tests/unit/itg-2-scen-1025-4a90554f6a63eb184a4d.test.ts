import { authenticateUser, AuthenticateUserInput, AuthenticateUserOutput, UserContext, validateRequiredFields, validateFieldFormat } from '../../src/logic/authorization-and-validation';

describe('SCEN-1025: authenticateUser function', () => {
  it('should return successful authentication with valid userId and password', async () => {
    // Arrange
    const input: AuthenticateUserInput = {
      userId: 'user001',
      password: 'validPassword123',
    };

    // Mock user data
    const mockUserContext: UserContext = {
      userId: 'user001',
      userName: 'Test User',
      role: 'worker',
      siteId: 'site001',
      teamId: 'team001',
      permissions: ['read_productivity_data', 'view_assignment'],
    };

    const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMDAxIn0.mockSignature';
    const mockExpiresAt = new Date(Date.now() + 3600000).toISOString();

    // Mock validateRequiredFields to return success (no missing fields)
    jest.spyOn(global as any, 'validateRequiredFields').mockReturnValue({
      isValid: true,
      missingFields: [],
    });

    // Mock validateFieldFormat to return success (valid format)
    jest.spyOn(global as any, 'validateFieldFormat').mockReturnValue({
      isValid: true,
      fieldName: 'userId',
      violationType: null,
      expectedConstraint: null,
      actualValue: 'user001',
      message: null,
    });

    // Mock password verification - user exists and password matches
    jest.spyOn(global as any, 'verifyPasswordHash').mockResolvedValue(true);

    // Mock account status check - account is active
    jest.spyOn(global as any, 'checkAccountStatus').mockResolvedValue({
      isActive: true,
      status: 'active',
    });

    // Mock token generation
    jest.spyOn(global as any, 'generateAuthToken').mockReturnValue({
      token: mockAuthToken,
      expiresAt: mockExpiresAt,
    });

    // Act
    const output: AuthenticateUserOutput = await authenticateUser(input);

    // Assert
    expect(output.success).toBe(true);
    expect(output.userContext).not.toBeNull();
    expect(output.userContext).toBeDefined();
    
    if (output.userContext) {
      expect(output.userContext.userId).toBe('user001');
      expect(output.userContext.userName).toBeDefined();
      expect(output.userContext.role).toBeDefined();
      expect(output.userContext.siteId).toBeDefined();
      expect(output.userContext.teamId).toBeDefined();
      expect(output.userContext.permissions).toBeDefined();
      expect(Array.isArray(output.userContext.permissions)).toBe(true);
    }

    expect(output.authToken).not.toBeNull();
    expect(typeof output.authToken).toBe('string');
    expect(output.authToken?.length).toBeGreaterThan(0);

    expect(output.expiresAt).not.toBeNull();
    expect(typeof output.expiresAt).toBe('string');
    expect(output.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});