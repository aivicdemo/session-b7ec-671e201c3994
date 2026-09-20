import { findUsersByRole, FindUsersByRoleInput, FindUsersByRoleOutput } from '../../src/logic/persistence-layer';

describe('SCEN-427: ステータスを指定して検索すると、そのステータスのユーザーだけが返される', () => {
  it('should return only users matching the specified status when searching by role', async () => {
    const input: FindUsersByRoleInput = {
      role: '現場リーダー',
      status: '有効',
      siteId: undefined,
      requestingUserId: 'user-001',
    };

    const result: FindUsersByRoleOutput = await findUsersByRole(input);

    expect(result.users).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.found).toBe(true);

    result.users.forEach((user) => {
      expect(user.role).toBe('現場リーダー');
      expect(user.status).toBe('有効');
    });

    const hasInvalidStatus = result.users.some((user) => user.status !== '有効');
    expect(hasInvalidStatus).toBe(false);

    const hasOtherRole = result.users.some((user) => user.role !== '現場リーダー');
    expect(hasOtherRole).toBe(false);
  });
});