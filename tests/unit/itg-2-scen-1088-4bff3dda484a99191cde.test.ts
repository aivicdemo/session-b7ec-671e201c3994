import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1088: 作業指示受領が記録されると、現場リーダーのダッシュボードにリアルタイム反映される', () => {
  it('有効なユーザーID と正しいパスワードで認証すると、現場リーダーコンテキストと認証トークンが返される', () => {
    // Arrange
    const input = {
      userId: 'leader001',
      password: 'ValidPassword123'
    };

    // Act
    const output = authenticateUser(input);

    // Assert
    // 認証成功の確認
    expect(output.success).toBe(true);

    // userContextの検証
    expect(output.userContext).not.toBeNull();
    if (output.userContext) {
      expect(output.userContext.userId).toBe('leader001');
      expect(output.userContext.role).toBe('現場リーダー');
      expect(output.userContext.siteId).toBe('東京01');
      expect(output.userContext.teamId).toBe('チームA');
      expect(output.userContext.permissions).toContain('作業指示受領記録参照');
      expect(output.userContext.permissions).toContain('ダッシュボード表示');
    }

    // authTokenの検証（36文字以上）
    expect(output.authToken).not.toBeNull();
    expect(typeof output.authToken).toBe('string');
    expect(output.authToken!.length).toBeGreaterThanOrEqual(36);

    // expiresAtの検証（ISO 8601形式、現在時刻から1時間後以降）
    expect(output.expiresAt).not.toBeNull();
    const expiresAtDate = new Date(output.expiresAt!);
    const nowDate = new Date();
    const oneHourLater = new Date(nowDate.getTime() + 60 * 60 * 1000);
    expect(expiresAtDate.getTime()).toBeGreaterThanOrEqual(oneHourLater.getTime());
  });
});