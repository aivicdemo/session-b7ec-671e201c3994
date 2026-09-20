import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1084: 認証済みユーザーが作業指示受領記録操作の実行権限を持つ場合', () => {
  it('権限検証が成功して次の工程に進む', async () => {
    // Setup: Mock user data with valid credentials and permissions
    const userId = 'user001';
    const password = 'validPassword';
    
    // Call authenticateUser with valid credentials
    const result = await authenticateUser({
      userId,
      password,
    });

    // Verify success
    expect(result.success).toBe(true);

    // Verify userContext is present and contains expected values
    expect(result.userContext).not.toBeNull();
    if (result.userContext) {
      expect(result.userContext.userId).toBe('user001');
      expect(result.userContext.role).toBe('作業指示受領者');
      expect(result.userContext.siteId).toBe('拠点A');
      expect(result.userContext.teamId).toBe('チームA');
      expect(result.userContext.permissions).toContain('作業指示受領記録操作');
    }

    // Verify authToken is a non-null string
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken?.length).toBeGreaterThan(0);

    // Verify expiresAt is a valid ISO 8601 datetime string
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    // Validate ISO 8601 format
    const expireDate = new Date(result.expiresAt!);
    expect(expireDate.getTime()).toBeGreaterThan(Date.now());
    expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});