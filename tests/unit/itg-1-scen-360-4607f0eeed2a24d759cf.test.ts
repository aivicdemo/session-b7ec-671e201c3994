import { describe, it, expect, beforeEach } from '@jest/globals';
import { authorizeOperation } from '../../src/logic/auth-authorization-audit';
import type {
  AuthorizeOperationInput,
  UserPermissionRecord,
} from '../../src/logic/auth-authorization-audit';

describe('SCEN-360: ユーザーの権限の有効期限が切れていると、PermissionExpiredError が発生する', () => {
  let input: AuthorizeOperationInput;
  let expiredPermission: UserPermissionRecord;
  let pastDate: Date;

  beforeEach(() => {
    const now = new Date();
    pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1時間前

    expiredPermission = {
      permissionId: 'perm-001',
      operationType: 'generate_allocation_plan',
      operationAllowed: true,
      validFromDateTime: new Date(pastDate.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      validUntilDateTime: pastDate.toISOString(),
      accessScopeFacilityIds: ['facility-001'],
      accessScopeTeamIds: null,
    };

    input = {
      userId: 'user-123',
      userRole: 'facility_leader',
      assignedFacilityId: 'facility-001',
      assignedTeamId: null,
      operationType: 'generate_allocation_plan',
      targetFacilityId: 'facility-001',
      targetTeamId: null,
      userPermissions: [expiredPermission],
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
    };
  });

  it('should throw PermissionExpiredError when user permission has expired', async () => {
    let errorWasThrown = false;
    let caughtError: Error | undefined;

    try {
      await authorizeOperation(input);
    } catch (error) {
      errorWasThrown = true;
      caughtError = error as Error;
    }

    expect(errorWasThrown).toBe(true);
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.name).toBe('PermissionExpiredError');
    expect(caughtError?.message).toContain('ユーザー user-123');
    expect(caughtError?.message).toContain('generate_allocation_plan');
    expect(caughtError?.message).toContain('に対する権限は');
    expect(caughtError?.message).toContain(pastDate.toISOString());
    expect(caughtError?.message).toContain('に失効しています');
  });
});