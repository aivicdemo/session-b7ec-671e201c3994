import { saveUser } from '../../src/logic/persistence-layer';

describe('SCEN-408: メールアドレスの形式が不正な場合のエラーハンドリング', () => {
  it('メールアドレスの形式が不正な場合、メールアドレスの形式が不正というエラーが発生する', async () => {
    const input = {
      userId: 'USR001',
      userName: 'testuser',
      email: 'invalid-email-format',
      passwordHash: 'hash123',
      fullName: 'Test User',
      role: '作業者',
      siteId: 'SITE001',
      teamId: 'TEAM001',
      status: '有効',
      createdBy: 'ADM001',
      updatedBy: undefined,
      requestingUserId: 'ADM001',
    };

    await expect(saveUser(input)).rejects.toThrow();
    await expect(saveUser(input)).rejects.toMatchObject({
      message: expect.stringContaining('メールアドレスの形式が不正です'),
    });
  });
});