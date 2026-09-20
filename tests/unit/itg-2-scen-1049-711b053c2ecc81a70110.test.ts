import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1049: ハンディターミナルデータ受信と再試行', () => {
  describe('ハンディターミナルからの作業実績データが正常に送信され、認証・検証・記録・同期・保存・通知の各工程を通して完了する', () => {
    it('有効なユーザーID と正しいパスワードで認証が成功し、認証トークンと有効期限が返却される', async () => {
      // 入力条件
      const userId = 'user123';
      const password = 'pass123';

      // 対象処理を実行
      const result = await authenticateUser({
        userId,
        password,
      });

      // 期待結果を検証
      expect(result.success).toBe(true);
      expect(result.userContext).not.toBeNull();
      expect(result.userContext!.userId).toBe('user123');
      expect(result.userContext!.role).toBe('worker');
      expect(result.userContext!.siteId).toBe('base001');
      expect(result.userContext!.teamId).toBe('team001');
      expect(result.userContext!.permissions).toContain('work_execution');
      
      expect(result.authToken).toBeTruthy();
      expect(typeof result.authToken).toBe('string');
      
      expect(result.expiresAt).toBeTruthy();
      expect(typeof result.expiresAt).toBe('string');
      
      // expiresAt が ISO 8601 形式であることを確認
      const expiresAtDate = new Date(result.expiresAt!);
      expect(expiresAtDate instanceof Date && !isNaN(expiresAtDate.getTime())).toBe(true);
      
      // expiresAt が現在より後の時刻であることを確認
      expect(new Date(result.expiresAt!) > new Date()).toBe(true);
    });
  });
});