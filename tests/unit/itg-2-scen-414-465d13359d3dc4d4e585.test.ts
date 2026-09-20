import { saveUser } from '../../src/logic/persistence-layer';

describe('SCEN-414: ユーザー認証・認可・プロフィール情報を新規保存または更新', () => {
  describe('所属拠点とチームの両方が指定されない場合でも正常に保存される', () => {
    it('siteId と teamId が null で保存され、success が true で返される', async () => {
      const input = {
        userId: 'USR001',
        userName: 'user01',
        email: 'user01@example.com',
        passwordHash: 'hash123',
        fullName: '山田太郎',
        role: '作業者',
        siteId: null,
        teamId: null,
        status: '有効',
        createdBy: 'ADMIN001',
        updatedBy: undefined,
        requestingUserId: 'ADMIN001',
      };

      const result = await saveUser(input);

      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.userId).toBe('USR001');
      expect(result.savedAt).toBeInstanceOf(Date);
    });
  });
});