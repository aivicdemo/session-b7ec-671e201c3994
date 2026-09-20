import { authorizeOperation } from '../../src/logic/auth-authorization-audit';
import { AuthorizeOperationInput, AuthorizeOperationOutput } from '../../src/logic/auth-authorization-audit';

describe('SCEN-366: 複数の権限レコードが存在し、そのうち1件が操作種別にマッチして有効期限内なら、権限判定を通過する', () => {
  it('should authorize operation when a single valid permission matches operationType and is within valid period', async () => {
    const currentDateTime = '2025-01-15T10:00:00Z';
    const validPermissionId = 'perm-valid-001';
    const expiredPermissionId = 'perm-expired-001';
    const mismatchedPermissionId = 'perm-mismatched-001';

    const userPermissions = [
      {
        permissionId: expiredPermissionId,
        operationType: 'generate_allocation_plan',
        operationAllowed: true,
        validFromDateTime: '2024-01-01T00:00:00Z',
        validUntilDateTime: '2025-01-01T00:00:00Z',
        accessScopeFacilityIds: null,
        accessScopeTeamIds: null,
      },
      {
        permissionId: validPermissionId,
        operationType: 'generate_allocation_plan',
        operationAllowed: true,
        validFromDateTime: '2025-01-01T00:00:00Z',
        validUntilDateTime: '2025-12-31T23:59:59Z',
        accessScopeFacilityIds: null,
        accessScopeTeamIds: null,
      },
      {
        permissionId: mismatchedPermissionId,
        operationType: 'approve_allocation_plan',
        operationAllowed: true,
        validFromDateTime: '2025-01-01T00:00:00Z',
        validUntilDateTime: '2025-12-31T23:59:59Z',
        accessScopeFacilityIds: null,
        accessScopeTeamIds: null,
      },
    ];

    const input: AuthorizeOperationInput = {
      userId: 'user-123',
      userRole: 'current_field_leader',
      assignedFacilityId: 'facility-A',
      assignedTeamId: 'team-1',
      operationType: 'generate_allocation_plan',
      targetFacilityId: 'facility-A',
      targetTeamId: 'team-1',
      userPermissions,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-123',
    };

    const output: AuthorizeOperationOutput = await authorizeOperation(input);

    // 権限レコード内の操作種別チェック：generate_allocation_plan と一致する権限が存在することを検証
    const matchingPermissions = userPermissions.filter(
      (p) => p.operationType === input.operationType
    );
    expect(matchingPermissions.length).toBeGreaterThan(0);
    expect(matchingPermissions).toContainEqual(
      expect.objectContaining({
        permissionId: validPermissionId,
        operationType: 'generate_allocation_plan',
      })
    );

    // 有効期限チェック：マッチした権限が有効期限内であることを検証
    const validPermissions = matchingPermissions.filter((p) => {
      const fromTime = new Date(p.validFromDateTime).getTime();
      const untilTime = new Date(p.validUntilDateTime).getTime();
      const currentTime = new Date(currentDateTime).getTime();
      return fromTime <= currentTime && currentTime <= untilTime;
    });
    expect(validPermissions.length).toBeGreaterThan(0);
    expect(validPermissions).toContainEqual(
      expect.objectContaining({
        permissionId: validPermissionId,
        validFromDateTime: '2025-01-01T00:00:00Z',
        validUntilDateTime: '2025-12-31T23:59:59Z',
      })
    );

    // 権限判定が通過したことを検証
    expect(output.authorized).toBe(true);
    expect(output.userId).toBe('user-123');
    expect(output.operationType).toBe('generate_allocation_plan');
    expect(output.denialReason).toBeNull();
    expect(output.auditLogId).toBeDefined();
    expect(typeof output.auditLogId).toBe('string');
    expect(output.auditLogId.length).toBeGreaterThan(0);
  });
});