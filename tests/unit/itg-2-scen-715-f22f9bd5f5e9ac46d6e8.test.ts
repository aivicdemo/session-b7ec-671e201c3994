import { authorizeUserAction } from '../../src/logic/authorization-and-validation';

describe('SCEN-715: authorizeUserAction - OperationNotDefinedError when operation is not defined', () => {
  it('should throw OperationNotDefinedError when requiredAction is not defined in authorization rules', async () => {
    const userContext = {
      userId: 'user-123',
      userName: 'Test User',
      role: 'admin',
      siteId: 'site-456',
      teamId: 'team-789',
      permissions: ['read_placement_plan', 'write_placement_plan']
    };

    const input = {
      userContext,
      requiredAction: 'undefined_operation_xyz',
      resourceType: 'placement_plan',
      resourceId: null,
      targetSiteId: null,
      targetTeamId: null,
      targetDepartmentId: null
    };

    await expect(authorizeUserAction(input)).rejects.toThrow();
    
    try {
      await authorizeUserAction(input);
    } catch (error) {
      expect(error).toHaveProperty('name', 'OperationNotDefinedError');
      expect(error).toHaveProperty('message', '要求された操作は定義されていません。');
    }
  });
});