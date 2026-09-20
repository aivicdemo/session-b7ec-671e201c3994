import { findUsersByRole, FindUsersByRoleOutput } from '../../src/logic/persistence-layer';

describe('SCEN-428: 拠点IDを指定して検索', () => {
  it('should return only users belonging to the specified siteId', async () => {
    const requestingUserId = 'user-admin-001';
    const siteId = 'site-001';
    const role = '現場リーダー';

    const result: FindUsersByRoleOutput = await findUsersByRole({
      role,
      status: undefined,
      siteId,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.users).toHaveLength(3);

    expect(result.users.every((user) => user.siteId === siteId)).toBe(true);

    expect(result.users.some((user) => user.siteId === 'site-002')).toBe(false);

    expect(result.users.some((user) => user.siteId === null)).toBe(false);

    expect(result.users.every((user) => user.role === role)).toBe(true);
  });
});