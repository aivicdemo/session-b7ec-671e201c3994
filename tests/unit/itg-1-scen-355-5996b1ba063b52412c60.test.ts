import { authorizeOperation } from '../../src/logic/auth-authorization-audit';

describe('SCEN-355: ユーザーが権限を持たない操作種別を実行しようとすると、UnauthorizedOperationError が発生する', () => {
  it('should throw UnauthorizedOperationError when user does not have permission for operation', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'worker',
      assignedFacilityId: 'facility-A',
      assignedTeamId: null,
      operationType: 'approve_allocation_plan',
      targetFacilityId: 'facility-A',
      targetTeamId: null,
      userPermissions: [],
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
    };

    await expect(authorizeOperation(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'UnauthorizedOperationError',
        message: expect.stringContaining(
          'ユーザー user-001 は操作 approve_allocation_plan に対する権限がありません。'
        ),
      })
    );
  });
});