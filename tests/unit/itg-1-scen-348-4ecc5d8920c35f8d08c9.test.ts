import { authenticateUser } from '../../src/logic/auth-authorization-audit';

describe('SCEN-348: ユーザー認証エラーハンドリング', () => {
  it('ユーザーのステータスが無効（非稼働）の場合、UserStatusInactiveErrorが発生する', async () => {
    // Arrange: authenticateUserの入力パラメータを準備
    const userId = 'user-001';
    const passwordPlaintext = 'password-string';
    const ipAddress = '192.168.1.100';

    // userAuthDataに、ステータスが'inactive'であるユーザーレコードと認証データを設定
    const userAuthData = {
      userId: 'user-001',
      userName: 'Test User',
      passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', // 正しいパスワードハッシュ
      status: 'inactive', // ステータスが無効
      role: 'worker',
      facilityId: 'fac-001',
      teamId: 'team-001',
    };

    const input = {
      userId,
      passwordPlaintext,
      ipAddress,
      userAuthData,
    };

    // Act & Assert: authenticateUser関数を呼び出し、例外をキャッチして検証
    await expect(async () => {
      await authenticateUser(input);
    }).rejects.toThrow();

    try {
      await authenticateUser(input);
      fail('UserStatusInactiveErrorが発生するはずです');
    } catch (error: any) {
      // 発生した例外を検証
      expect(error.name).toBe('UserStatusInactiveError');
      expect(error.message).toBe('このユーザーアカウントは無効です。管理者に連絡してください。');
    }
  });
});