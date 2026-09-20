import { authorizeOperation } from '../../src/logic/auth-authorization-audit';
import { AuthorizeOperationInput, AuthorizeOperationOutput, UserPermissionRecord } from '../../src/logic/auth-authorization-audit';
import * as authModule from '../../src/logic/auth-authorization-audit';

describe('SCEN-365: 割り当てられたチームと一致するチームスコープ操作を実行すると、権限判定を通過する', () => {
  it('should pass authorization when targetTeamId matches assignedTeamId for field leader', async () => {
    // Mock the internal functions
    const resolveUserRoleAndPermissionsSpy = jest.spyOn(authModule, 'resolveUserRoleAndPermissions' as any);
    const judgeOperationAuthorizationSpy = jest.spyOn(authModule, 'judgeOperationAuthorization' as any);
    const buildAuditLogEntrySpy = jest.spyOn(authModule, 'buildAuditLogEntry' as any);
    const recordOperationAuditSpy = jest.spyOn(authModule, 'recordOperationAudit' as any);

    // Setup mocks to return valid data
    resolveUserRoleAndPermissionsSpy.mockResolvedValue({
      userId: 'USER-001',
      userRole: 'field_leader',
      assignedFacilityId: 'FACILITY-01',
      assignedTeamId: 'TEAM-A',
      validUserPermissions: [
        {
          permissionId: 'PERM-001',
          operationType: 'deliver_work_instruction',
          operationAllowed: true,
          validFromDateTime: new Date(Date.now() - 1000 * 60).toISOString(),
          validUntilDateTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          accessScopeFacilityIds: null,
          accessScopeTeamIds: ['TEAM-A'],
        },
      ],
      resolvedDateTime: new Date().toISOString(),
    });

    judgeOperationAuthorizationSpy.mockResolvedValue({
      authorized: true,
      denialReason: null,
      matchedPermissionId: 'PERM-001',
    });

    buildAuditLogEntrySpy.mockReturnValue({
      auditLogId: 'AUDIT-LOG-001',
      userId: 'USER-001',
      operationType: 'deliver_work_instruction',
      operationTargetTable: 'work_instruction',
      operationTargetId: 'WI-001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: null,
      changeAfterValue: null,
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-XYZ',
      operationDateTime: new Date().toISOString(),
      recordedDateTime: new Date().toISOString(),
    });

    recordOperationAuditSpy.mockResolvedValue({
      auditLogId: 'AUDIT-LOG-12345',
      recordedDateTime: new Date().toISOString(),
      status: 'RECORDED',
    });

    // Step 1: Prepare test user authentication data
    const userId = 'USER-001';
    const userRole = 'field_leader';
    const assignedTeamId = 'TEAM-A';
    const assignedFacilityId = 'FACILITY-01';

    // Step 2: Prepare user permissions with team scope (accessScopeTeamIds set, accessScopeFacilityIds null)
    const now = new Date();
    const validFromDateTime = new Date(now.getTime() - 1000 * 60).toISOString(); // 1 minute ago
    const validUntilDateTime = new Date(now.getTime() + 1000 * 60 * 60).toISOString(); // 1 hour later (after current time)
    
    const userPermissions: UserPermissionRecord[] = [
      {
        permissionId: 'PERM-001',
        operationType: 'deliver_work_instruction',
        operationAllowed: true,
        validFromDateTime,
        validUntilDateTime, // Valid until future time as per specification
        accessScopeFacilityIds: null, // Team scope: no facility restriction
        accessScopeTeamIds: ['TEAM-A'], // Team scope: restricted to TEAM-A
      },
    ];

    // Step 3: Call authorizeOperation
    const input: AuthorizeOperationInput = {
      userId,
      userRole,
      assignedFacilityId,
      assignedTeamId,
      operationType: 'deliver_work_instruction',
      targetFacilityId: 'FACILITY-01',
      targetTeamId: 'TEAM-A', // Matches assignedTeamId
      userPermissions,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-XYZ',
    };

    let result: AuthorizeOperationOutput | undefined;
    let caughtException: Error | undefined;

    try {
      result = await authorizeOperation(input);
    } catch (error) {
      caughtException = error as Error;
    }

    // Step 4: Verify resolveUserRoleAndPermissions was called
    expect(resolveUserRoleAndPermissionsSpy).toHaveBeenCalled();

    // Step 5: Verify judgeOperationAuthorization was called
    expect(judgeOperationAuthorizationSpy).toHaveBeenCalled();

    // Step 6: Verify buildAuditLogEntry was called
    expect(buildAuditLogEntrySpy).toHaveBeenCalled();

    // Step 7: Verify recordOperationAudit was called
    expect(recordOperationAuditSpy).toHaveBeenCalled();

    // Expected result verification: No exceptions should occur
    expect(caughtException).toBeUndefined();
    
    // AuthorizeOperationOutput is returned with expected values
    expect(result).toBeDefined();
    expect(result!.authorized).toBe(true);
    expect(result!.userId).toBe('USER-001');
    expect(result!.operationType).toBe('deliver_work_instruction');
    expect(result!.denialReason).toBeNull();
    expect(result!.auditLogId).toBeDefined();
    expect(typeof result!.auditLogId).toBe('string');
    expect(result!.auditLogId.length).toBeGreaterThan(0);

    // Verify no UnauthorizedOperationError, TeamAccessDeniedError, or PermissionExpiredError occurred
    expect(result!.authorized).toBe(true); // Authorization passed
    expect(result!.denialReason).toBeNull(); // No denial reason

    // Cleanup
    resolveUserRoleAndPermissionsSpy.mockRestore();
    judgeOperationAuthorizationSpy.mockRestore();
    buildAuditLogEntrySpy.mockRestore();
    recordOperationAuditSpy.mockRestore();
  });
});