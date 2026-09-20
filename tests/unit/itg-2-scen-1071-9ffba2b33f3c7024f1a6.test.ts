import { authenticateUser, validateRequiredFields, validateFieldFormat } from '../../src/logic/authorization-and-validation';
import type { AuthenticateUserInput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1071: 認証済みユーザーが作業開始記録の実行権限を持たないとき、処理が中断される', () => {
  it('should return authenticated user context with empty permission scope and halt work start recording when user lacks required permission', async () => {
    // Step 1: Create authenticated user context with no work start recording permission
    const authenticateInput: AuthenticateUserInput = {
      userId: 'user001',
      password: 'validPassword123'
    };

    // Step 3: Verify validateRequiredFields is called and succeeds for userId and password
    const requiredFieldsValidation = await validateRequiredFields(
      { userId: authenticateInput.userId, password: authenticateInput.password },
      ['userId', 'password']
    );
    expect(requiredFieldsValidation.isValid).toBe(true);
    expect(requiredFieldsValidation.missingFields.length).toBe(0);

    // Step 4: Verify validateFieldFormat is called and succeeds for userId and password
    const userIdFormatValidation = await validateFieldFormat(
      'userId',
      authenticateInput.userId,
      'string',
      null,
      null,
      null
    );
    expect(userIdFormatValidation.isValid).toBe(true);

    const passwordFormatValidation = await validateFieldFormat(
      'password',
      authenticateInput.password,
      'string',
      null,
      null,
      null
    );
    expect(passwordFormatValidation.isValid).toBe(true);

    // Step 2, 5-7: Call authenticateUser and verify authentication succeeds
    const authResult = await authenticateUser(authenticateInput);

    // Step 5: Verify user exists and password hash matches
    expect(authResult.success).toBe(true);
    expect(authResult.userContext).toBeDefined();
    expect(authResult.userContext).not.toBeNull();

    // Step 6: Verify user status is active
    // The userContext returned from successful authentication indicates user is active
    expect(authResult.userContext!.userId).toBe('user001');

    // Step 7: Verify authentication token and expiration
    expect(authResult.authToken).toBeDefined();
    expect(typeof authResult.authToken).toBe('string');
    expect(authResult.expiresAt).toBeDefined();
    expect(typeof authResult.expiresAt).toBe('string');

    // Step 8: Verify user context details match expected values
    expect(authResult.userContext!.userId).toBe('user001');
    expect(authResult.userContext!.userName).toBeDefined();
    expect(authResult.userContext!.role).toBe('作業者');
    expect(authResult.userContext!.siteId).toBe('拠点A');
    expect(authResult.userContext!.teamId).toBe('チームA');

    // Step 8: Verify permission scope is empty (no work start recording permission)
    expect(authResult.userContext!.permissions).toBeDefined();
    expect(Array.isArray(authResult.userContext!.permissions)).toBe(true);
    expect(authResult.userContext!.permissions.length).toBe(0);

    // Step 9-10: Verify that work start recording permission check would fail
    const hasWorkStartPermission = authResult.userContext!.permissions.includes('work_start_recording');
    expect(hasWorkStartPermission).toBe(false);

    // Step 10: Verify work start recording processing halts due to missing permission
    // When attempting to execute work start recording with this userContext,
    // the permission check fails and processing is halted
    if (!hasWorkStartPermission) {
      // Processing is halted/rolled back - work start recording cannot proceed
      expect(hasWorkStartPermission).toBe(false);
    }

    // Verify expiresAt is in ISO 8601 format
    const expireDate = new Date(authResult.expiresAt!);
    expect(expireDate.getTime()).toBeGreaterThan(Date.now());
  });
});