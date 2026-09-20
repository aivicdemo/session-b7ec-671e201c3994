import { findUserById } from '../../src/logic/persistence-layer';

describe('SCEN-415: 有効なユーザーIDで検索すると、対応するユーザーの全プロフィール情報が返される', () => {
  it('should return complete user profile information for valid userId', async () => {
    const input = {
      userId: 'USER-001',
      requestingUserId: 'ADMIN-001',
    };

    const result = await findUserById(input);

    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.userId).toBe('USER-001');
    expect(result.userName).toBe('taro_yamada');
    expect(result.email).toBe('taro.yamada@example.com');
    expect(result.fullName).toBe('山田太郎');
    expect(result.role).toBe('作業者');
    expect(result.siteId).toBe('SITE-001');
    expect(result.teamId).toBe('TEAM-A');
    expect(result.status).toBe('active');
    expect(result.lastLoginDateTime).toEqual(new Date('2024-01-15T14:30:00Z'));
  });
});