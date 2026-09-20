import {
  authorizeOperation,
  AuthorizeOperationInput,
  AuthorizeOperationOutput,
  resolveUserRoleAndPermissions,
  judgeOperationAuthorization,
  buildAuditLogEntry,
  recordOperationAudit,
} from '../../src/logic/auth-authorization-audit';

jest.mock('../../src/logic/auth-authorization-audit', () => {
  const actual = jest.requireActual('../../src/logic/auth-authorization-audit');
  return {
    ...actual,
    resolveUserRoleAndPermissions: jest.fn(),
    judgeOperationAuthorization: jest.fn(),
    buildAuditLogEntry: jest.fn(),
    recordOperationAudit: jest.fn(),
  };
});

describe('SCEN-362: 全拠点アクセス可能なユーザーが任意の拠点スコープ操作を実行すると、権限判定を通過する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authorize operation when user has facility-wide access (assignedFacilityId=null)', async () => {
    const currentDateTime = new Date().toISOString();
    const futureDateTime = new Date(Date.now() + 86400000).toISOString();

    const input: AuthorizeOperationInput = {
      userId: 'user-001',
      userRole: 'manager',
      assignedFacilityId: null,
      assignedTeamId: null,
      operationType: 'view_dashboard',
      targetFacilityId: 'facility-A',
      userPermissions: [
        {
          permissionId: 'perm-001',
          operationType: 'view_dashboard',
          operationAllowed: true,
          validFromDateTime: new Date(Date.now() - 86400000).toISOString(),
          validUntilDateTime: futureDateTime,
          accessScopeFacilityIds: null,
          accessScopeTeamIds: null,
        },
      ],
      ipAddress: '192.168.1.1',
      sessionId: 'session-abc123',
    };

    // Stub resolveUserRoleAndPermissions to return valid user status and in-scope permissions
    (resolveUserRoleAndPermissions as jest.Mock).mockResolvedValue({
      userId: 'user-001',
      userRole: 'manager',
      assignedFacilityId: null,
      assignedTeamId: null,
      validUserPermissions: [
        {
          permissionId: 'perm-001',
          operationType: 'view_dashboard',
          operationAllowed: true,
          validFromDateTime: new Date(Date.now() - 86400000).toISOString(),
          validUntilDateTime: futureDateTime,
          accessScopeFacilityIds: null,
          accessScopeTeamIds: null,
        },
      ],
      resolvedDateTime: currentDateTime,
    });

    // Stub judgeOperationAuthorization to authorize the operation for facility-wide access
    (judgeOperationAuthorization as jest.Mock).mockResolvedValue({
      authorized: true,
      denialReason: null,
      matchedPermissionId: 'perm-001',
    });

    // Stub buildAuditLogEntry to generate audit log entry
    (buildAuditLogEntry as jest.Mock).mockReturnValue({
      auditLogId: 'audit-log-xyz',
      userId: 'user-001',
      operationType: 'view_dashboard',
      operationTargetTable: 'dashboard',
      operationTargetId: 'facility-A',
      operationStatus: 'SUCCESS',
      changeBeforeValue: null,
      changeAfterValue: null,
      errorMessage: null,
      ipAddress: '192.168.1.1',
      sessionId: 'session-abc123',
      operationDateTime: currentDateTime,
      recordedDateTime: currentDateTime,
    });

    // Stub recordOperationAudit to return auditLogId='audit-log-xyz'
    (recordOperationAudit as jest.Mock).mockResolvedValue({
      auditLogId: 'audit-log-xyz',
      recordedDateTime: currentDateTime,
      status: 'RECORDED',
    });

    // Call the actual authorizeOperation function with input values
    const result: AuthorizeOperationOutput = await authorizeOperation(input);

    // Verify the output matches expected result: authorized=true, denialReason=null, auditLogId='audit-log-xyz'
    expect(result.authorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('view_dashboard');
    expect(result.denialReason).toBeNull();
    expect(result.auditLogId).toBe('audit-log-xyz');

    // Verify that resolveUserRoleAndPermissions was called with the correct input
    expect(resolveUserRoleAndPermissions).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
      })
    );

    // Verify that judgeOperationAuthorization was called with the resolved permissions
    expect(judgeOperationAuthorization).toHaveBeenCalled();

    // Verify that buildAuditLogEntry was called
    expect(buildAuditLogEntry).toHaveBeenCalled();

    // Verify that recordOperationAudit was called
    expect(recordOperationAudit).toHaveBeenCalled();
  });
});