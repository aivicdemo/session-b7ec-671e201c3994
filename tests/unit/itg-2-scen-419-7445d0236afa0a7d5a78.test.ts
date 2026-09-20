import { findUserById } from '../../src/logic/persistence-layer';

describe('SCEN-419: 拠点に紐づかない役割のユーザーではsiteIdがnullで返される', () => {
  it('should return siteId as null for system administrator user', async () => {
    const input = {
      userId: 'USER-SYS-001',
      requestingUserId: 'USER-ADMIN-001',
    };

    const result = await findUserById(input);

    expect(result.found).toBe(true);
    expect(result.userId).toBe('USER-SYS-001');
    expect(result.userName).toBe('sysadmin');
    expect(result.email).toBe('sysadmin@company.com');
    expect(result.fullName).toBe('システム太郎');
    expect(result.role).toBe('システム管理者');
    expect(result.siteId).toBeNull();
    expect(result.teamId).toBeNull();
    expect(result.status).toBe('active');
    expect(result.lastLoginDateTime).toEqual(new Date('2024-01-15T10:30:00Z'));
  });
});