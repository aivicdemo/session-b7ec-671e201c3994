import { saveTeam } from '../../src/logic/data-persistence';

describe('SCEN-553: チーム情報を新規作成または更新して永続化し、チームの基本属性・所属拠点・稼働状況を一元管理する。', () => {
  describe('チーム説明がnullまたはundefinedのとき、チーム説明なしで正常に保存される', () => {
    it('teamDescription=nullで新規チームが正常に保存される', async () => {
      const input = {
        teamId: null,
        teamName: '営業支援チーム',
        facilityId: 'FAC001',
        teamLeaderId: 'WKR001',
        teamDescription: null,
        operatingStatus: '稼働中',
        capacity: 5,
        createdBy: 'ADM001',
        updatedBy: undefined,
      };

      const result = await saveTeam(input);

      expect(result).toBeDefined();
      expect(result.teamId).toBeTruthy();
      expect(typeof result.teamId).toBe('string');
      expect(result.teamName).toBe('営業支援チーム');
      expect(result.facilityId).toBe('FAC001');
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.isNewRecord).toBe(true);
    });

    it('teamDescription=undefinedで新規チームが正常に保存される', async () => {
      const input = {
        teamId: null,
        teamName: '営業支援チーム',
        facilityId: 'FAC001',
        teamLeaderId: 'WKR001',
        teamDescription: undefined,
        operatingStatus: '稼働中',
        capacity: 5,
        createdBy: 'ADM001',
        updatedBy: undefined,
      };

      const result = await saveTeam(input);

      expect(result).toBeDefined();
      expect(result.teamId).toBeTruthy();
      expect(typeof result.teamId).toBe('string');
      expect(result.teamName).toBe('営業支援チーム');
      expect(result.facilityId).toBe('FAC001');
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.isNewRecord).toBe(true);
    });

    it('保存されたチーム情報がチーム説明なしで永続化される', async () => {
      const input = {
        teamId: null,
        teamName: '営業支援チーム',
        facilityId: 'FAC001',
        teamLeaderId: 'WKR001',
        teamDescription: null,
        operatingStatus: '稼働中',
        capacity: 5,
        createdBy: 'ADM001',
        updatedBy: undefined,
      };

      const createResult = await saveTeam(input);

      const { getTeamById } = await import('../../src/logic/data-persistence');
      const retrievedTeam = await getTeamById({ teamId: createResult.teamId });

      expect(retrievedTeam).toBeDefined();
      expect(retrievedTeam.teamId).toBe(createResult.teamId);
      expect(retrievedTeam.teamName).toBe('営業支援チーム');
      expect(retrievedTeam.facilityId).toBe('FAC001');
      expect(retrievedTeam.teamLeaderId).toBe('WKR001');
      expect(retrievedTeam.teamDescription).toBeNull();
      expect(retrievedTeam.operatingStatus).toBe('稼働中');
      expect(retrievedTeam.capacity).toBe(5);
    });
  });
});