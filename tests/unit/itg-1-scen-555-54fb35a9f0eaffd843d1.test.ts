import { getTeamById } from '../../src/logic/data-persistence';

describe('SCEN-555: 有効なチームIDで検索した場合、該当するチーム情報を取得できる', () => {
  it('getTeamById関数が指定されたチームIDに対応するチーム情報を返す', async () => {
    const teamId = 'TEAM-001';

    const result = await getTeamById({ teamId });

    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.teamName).toBeDefined();
    expect(typeof result.teamName).toBe('string');
    expect(result.facilityId).toBeDefined();
    expect(typeof result.facilityId).toBe('string');
    expect(result.teamLeaderId).toBeDefined();
    expect(typeof result.teamLeaderId).toBe('string');
    expect(result.operatingStatus).toBeDefined();
    expect(typeof result.operatingStatus).toBe('string');
    expect(result.capacity).toBeDefined();
    expect(typeof result.capacity).toBe('number');
    expect(result.createdAt).toBeDefined();
    expect(typeof result.createdAt).toBe('string');
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe('string');
    expect(result.createdBy).toBeDefined();
    expect(typeof result.createdBy).toBe('string');
  });
});