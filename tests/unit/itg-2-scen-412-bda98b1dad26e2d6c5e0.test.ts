import { saveUser } from '../../src/logic/persistence-layer';

describe('SCEN-412: 新規作成時の出力に操作種別が\'create\'で設定される', () => {
  it('should return operation as "create" when saving a new user', async () => {
    const input = {
      userId: 'USR-NEW-001',
      userName: 'tanaka_taro',
      email: 'tanaka.taro@example.com',
      passwordHash: '$2b$10$...',
      fullName: '田中太郎',
      role: '作業者',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      status: '有効',
      createdBy: 'ADM-001',
      requestingUserId: 'ADM-001',
    };

    const beforeCall = new Date();
    const result = await saveUser(input);
    const afterCall = new Date();

    expect(result.success).toBe(true);
    expect(result.userId).toBe('USR-NEW-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });
});