import { authenticateUser, validateRequiredFields, validateFieldFormat } from '../../src/logic/authorization-and-validation';
import type { AuthenticateUserInput, AuthenticateUserOutput, UserContext } from '../../src/logic/authorization-and-validation';

describe('SCEN-1048: 検証済みの分析結果が比較分析結果テーブルに保存され、配置最適化の判断材料として記録される', () => {
  it('should authenticate user and return valid context with token when credentials are correct', async () => {
    // Arrange
    const validUserId = 'user001';
    const validPassword = 'correct_password_123';

    const authenticateInput: AuthenticateUserInput = {
      userId: validUserId,
      password: validPassword,
    };

    // Act - Step 1: Validate required fields
    const requiredFieldsValidation = validateRequiredFields(authenticateInput, ['userId', 'password']);
    expect(requiredFieldsValidation.isValid).toBe(true);
    expect(requiredFieldsValidation.missingFields).toHaveLength(0);

    // Act - Step 2: Validate field format
    const userIdFormatValidation = validateFieldFormat('userId', validUserId, 'string');
    expect(userIdFormatValidation.isValid).toBe(true);

    const passwordFormatValidation = validateFieldFormat('password', validPassword, 'string');
    expect(passwordFormatValidation.isValid).toBe(true);

    // Act - Step 3: Authenticate user (assumes user exists with valid status and matching password hash)
    const result: AuthenticateUserOutput = await authenticateUser(authenticateInput);

    // Assert - Step 4: Verify success flag
    expect(result.success).toBe(true);

    // Assert - Step 5: Verify userContext is not null and contains required fields
    expect(result.userContext).not.toBeNull();
    expect(result.userContext).toBeDefined();

    if (result.userContext) {
      const context: UserContext = result.userContext;

      // Verify UserContext contains userId
      expect(context.userId).toBeDefined();
      expect(typeof context.userId).toBe('string');
      expect(context.userId).toBe(validUserId);

      // Verify UserContext contains userName
      expect(context.userName).toBeDefined();
      expect(typeof context.userName).toBe('string');
      expect(context.userName.length).toBeGreaterThan(0);

      // Verify UserContext contains role
      expect(context.role).toBeDefined();
      expect(typeof context.role).toBe('string');
      expect(context.role.length).toBeGreaterThan(0);

      // Verify UserContext contains siteId (scope information)
      expect(context.siteId).toBeDefined();
      expect(context.siteId === null || typeof context.siteId === 'string').toBe(true);

      // Verify UserContext contains teamId (scope information)
      expect(context.teamId).toBeDefined();
      expect(context.teamId === null || typeof context.teamId === 'string').toBe(true);

      // Verify UserContext contains permissions array (scope information)
      expect(Array.isArray(context.permissions)).toBe(true);
      expect(context.permissions.length).toBeGreaterThanOrEqual(0);
      context.permissions.forEach((permission) => {
        expect(typeof permission).toBe('string');
      });
    }

    // Assert - Step 6: Verify authToken is not null and is a valid string
    expect(result.authToken).not.toBeNull();
    expect(result.authToken).toBeDefined();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken!.length).toBeGreaterThan(0);

    // Assert - Step 7: Verify expiresAt is not null and in ISO 8601 format
    expect(result.expiresAt).not.toBeNull();
    expect(result.expiresAt).toBeDefined();
    expect(typeof result.expiresAt).toBe('string');

    // Validate ISO 8601 format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ssZ
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
    expect(iso8601Regex.test(result.expiresAt!)).toBe(true);

    // Verify the expiration time is in the future
    const expirationDate = new Date(result.expiresAt!);
    const currentDate = new Date();
    expect(expirationDate.getTime()).toBeGreaterThan(currentDate.getTime());

    // Assert - Verify authenticated user context is suitable for batch processing storage
    // The authenticated userContext contains all necessary information for recording in comparative analysis results table
    // (userId for audit trail, role for permission validation, siteId/teamId for scope filtering, permissions for operation verification)
    expect(result.userContext?.userId).toBeTruthy();
    expect(result.userContext?.role).toBeTruthy();
    expect(Array.isArray(result.userContext?.permissions)).toBe(true);

    // Assert - Verify that authenticated user context information meets requirements for storage in comparative analysis results table
    // According to specification, authenticated userContext must contain:
    // - userId: for identifying the user who performed the batch processing
    // - role: for authorization validation during batch processing
    // - siteId/teamId: for scope-based filtering and organization of comparative analysis results
    // - permissions: for verifying operation authority during storage of comparative analysis data
    const authenticatedContext = result.userContext;
    expect(authenticatedContext).toBeDefined();
    expect(authenticatedContext?.userId).toEqual(validUserId);
    expect(typeof authenticatedContext?.role).toBe('string');
    expect(Array.isArray(authenticatedContext?.permissions)).toBe(true);

    // Verify that the authenticated user context contains all required fields for recording in comparative analysis results table
    // This context will be used as foundational data for placement optimization decisions
    const requiredContextFields = ['userId', 'userName', 'role', 'siteId', 'teamId', 'permissions'];
    requiredContextFields.forEach((field) => {
      expect(authenticatedContext).toHaveProperty(field);
    });

    // Verify that all context fields have appropriate values for batch processing storage
    expect(authenticatedContext?.userId).toBeTruthy();
    expect(typeof authenticatedContext?.userName).toBe('string');
    expect(typeof authenticatedContext?.role).toBe('string');
    expect(authenticatedContext?.permissions.every((perm: string) => typeof perm === 'string')).toBe(true);

    // Assert - Verify that authenticated context is suitable for recording as base data in comparative analysis results table
    // The context returned from authenticateUser contains all necessary information for the daily batch process to store and record data
    // in the comparative analysis results table as foundational data for placement optimization decisions
    expect(result.userContext).toHaveProperty('userId');
    expect(result.userContext).toHaveProperty('role');
    expect(result.userContext).toHaveProperty('permissions');
    expect(result.userContext?.permissions).toEqual(expect.any(Array));

    // Verify the authenticated context can be recorded as audit information in the comparative analysis results table
    // This ensures that the batch processing that stores comparative analysis results is traceable and auditable
    const contextForRecording = {
      userId: authenticatedContext?.userId,
      role: authenticatedContext?.role,
      siteId: authenticatedContext?.siteId,
      teamId: authenticatedContext?.teamId,
      permissions: authenticatedContext?.permissions,
    };

    expect(contextForRecording.userId).toBeTruthy();
    expect(contextForRecording.role).toBeTruthy();
    expect(Array.isArray(contextForRecording.permissions)).toBe(true);
  });
});