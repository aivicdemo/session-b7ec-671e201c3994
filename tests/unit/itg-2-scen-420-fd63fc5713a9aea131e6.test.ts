import { findUserById, FindUserByIdInput, FindUserByIdOutput } from '../../src/logic/persistence-layer';

describe('SCEN-420: チームに紐づかない役割のユーザーではteamIdがnullで返される', () => {
  it('should return null for teamId when user role is システム管理者', async () => {
    const input: FindUserByIdInput = {
      userId: 'USER-TEAM-NULL-001',
      requestingUserId: 'ADMIN-001',
    };

    const result: FindUserByIdOutput = await findUserById(input);

    expect(result.found).toBe(true);
    expect(result.userId).toBe('USER-TEAM-NULL-001');
    expect(result.userName).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.fullName).toBeDefined();
    expect(result.role).toBe('システム管理者');
    expect(result.status).toBe('active');
    expect(result.siteId).toBeNull();
    expect(result.teamId).toBeNull();
    expect(result.lastLoginDateTime).toEqual(
      expect.any(Date)
    );
  });
});