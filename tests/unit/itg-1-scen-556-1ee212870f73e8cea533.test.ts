import { getTeamById } from '../../src/logic/data-persistence';

describe('SCEN-556: 存在しないチームIDで検索した場合、nullを返す', () => {
  it('存在しないチームIDで検索した場合、nullを返す', async () => {
    const nonexistentTeamId = 'team-nonexistent-999';
    
    const result = await getTeamById({ teamId: nonexistentTeamId });
    
    expect(result).toBeNull();
  });
});