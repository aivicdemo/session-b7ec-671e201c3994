import { authorizeOperation } from '../../src/logic/auth-authorization-audit';

describe('SCEN-358: 割り当てられた拠点以外の拠点スコープ操作を試みると、FacilityAccessDeniedError が発生する', () => {
  it('should throw FacilityAccessDeniedError when user tries to access a facility outside their assigned scope', async () => {
    const userId = 'user-001';
    const userRole = 'site_leader';
    const assignedFacilityId = 'facility-A';
    const assignedTeamId = null;
    const operationType = 'generate_allocation_plan';
    const targetFacilityId = 'facility-B';
    const targetTeamId = null;
    const ipAddress = '192.168.1.100';
    const sessionId = 'session-xyz-123';
    const currentDateTime = new Date().toISOString();

    const userPermissions = [
      {
        permissionId: 'perm-001',
        operationType: 'generate_allocation_plan',
        operationAllowed: true,
        validFromDateTime: new Date(Date.now() - 86400000).toISOString(),
        validUntilDateTime: new Date(Date.now() + 86400000).toISOString(),
        accessScopeFacilityIds: ['facility-A'],
        accessScopeTeamIds: null,
      },
    ];

    const input = {
      userId,
      userRole,
      assignedFacilityId,
      assignedTeamId,
      operationType,
      targetFacilityId,
      targetTeamId,
      userPermissions,
      ipAddress,
      sessionId,
    };

    await expect(authorizeOperation(input)).rejects.toThrow();
    await expect(authorizeOperation(input)).rejects.toMatchObject({
      name: 'FacilityAccessDeniedError',
    });

    try {
      await authorizeOperation(input);
      fail('Should have thrown FacilityAccessDeniedError');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toContain('user-001');
        expect(error.message).toContain('facility-B');
        expect(error.message).toContain('facility-A');
        expect(error.message).toContain('アクセス権限がありません');
      } else {
        fail('Error should be an instance of Error');
      }
    }
  });
});