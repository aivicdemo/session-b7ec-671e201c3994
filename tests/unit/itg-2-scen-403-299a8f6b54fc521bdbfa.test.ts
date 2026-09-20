import { saveUser } from '../../src/logic/persistence-layer';

describe('SCEN-403: 新規ユーザーの正常保存', () => {
  it('必須フィールドが全て揃い有効な形式で、新規ユーザーが正常に保存される', async () => {
    const input = {
      userId: 'USR-NEW-001',
      userName: 'tanaka_taro',
      email: 'tanaka.taro@company.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      fullName: '田中太郎',
      role: '作業者',
      siteId: 'SITE-001',
      teamId: 'TEAM-A',
      status: '有効',
      createdBy: 'ADM-001',
      requestingUserId: 'ADM-001',
    };

    const result = await saveUser(input);

    expect(result.success).toBe(true);
    expect(result.userId).toBe('USR-NEW-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(Date.now() - 5000);
  });
});