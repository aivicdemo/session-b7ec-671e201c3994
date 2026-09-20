import { authorizeOperation } from '../../src/logic/auth-authorization-audit';

describe('SCEN-367: 有効な権限レコードは存在するが、すべての権限の有効期限が切れていると、PermissionExpiredError が発生する', () => {
  it('should throw PermissionExpiredError when all user permissions have expired', () => {
    // Arrange
    const userId = 'user-001';
    const userRole = '作業者';
    const assignedFacilityId = 'facility-A';
    const assignedTeamId = 'team-1';
    const operationType = 'view_dashboard';
    const targetFacilityId = 'facility-A';
    const targetTeamId = 'team-1';
    const ipAddress = '192.168.1.100';
    const sessionId = 'session-xyz-123';

    // Create two permission records, both with expired valid periods
    const userPermissions = [
      {
        permissionId: 'perm-001',
        operationType: 'view_dashboard',
        operationAllowed: true,
        validFromDateTime: '2023-12-01T00:00:00Z',
        validUntilDateTime: '2024-01-01T00:00:00Z',
        accessScopeFacilityIds: ['facility-A'],
        accessScopeTeamIds: ['team-1'],
      },
      {
        permissionId: 'perm-002',
        operationType: 'view_dashboard',
        operationAllowed: true,
        validFromDateTime: '2024-01-01T00:00:00Z',
        validUntilDateTime: '2024-01-15T00:00:00Z',
        accessScopeFacilityIds: ['facility-A'],
        accessScopeTeamIds: ['team-1'],
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

    // Act & Assert
    expect(() => {
      authorizeOperation(input);
    }).toThrow(expect.objectContaining({
      name: 'PermissionExpiredError',
      message: 'ユーザー user-001 の操作 view_dashboard に対する権限は 2024-01-15T00:00:00Z に失効しています。',
    }));
  });
});