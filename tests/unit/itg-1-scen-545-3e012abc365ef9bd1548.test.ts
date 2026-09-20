import { saveTeam } from '../../src/logic/data-persistence';

describe('SCEN-545: チーム名が空文字列またはnullまたはundefinedのとき、チーム名必須エラーが発生する', () => {
  it('teamName が空文字列のときは InvalidTeamNameError がスローされること', async () => {
    const input = {
      teamName: '',
      facilityId: 'facility-123',
      teamLeaderId: 'leader-456',
      operatingStatus: 'active',
      capacity: 10,
      createdBy: 'user-789'
    };

    await expect(saveTeam(input)).rejects.toThrow('チーム名は必須です。');
  });

  it('teamName が null のときは InvalidTeamNameError がスローされること', async () => {
    const input = {
      teamName: null as any,
      facilityId: 'facility-123',
      teamLeaderId: 'leader-456',
      operatingStatus: 'active',
      capacity: 10,
      createdBy: 'user-789'
    };

    await expect(saveTeam(input)).rejects.toThrow('チーム名は必須です。');
  });

  it('teamName が undefined のときは InvalidTeamNameError がスローされること', async () => {
    const input = {
      teamName: undefined as any,
      facilityId: 'facility-123',
      teamLeaderId: 'leader-456',
      operatingStatus: 'active',
      capacity: 10,
      createdBy: 'user-789'
    };

    await expect(saveTeam(input)).rejects.toThrow('チーム名は必須です。');
  });
});