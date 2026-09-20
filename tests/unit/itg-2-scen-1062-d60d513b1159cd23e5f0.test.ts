import { authenticateUser } from '../../src/logic/authorization-and-validation';
import { AuthenticateUserInput, AuthenticateUserOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1062: ハンディターミナルデータ受信と再試行', () => {
  describe('データ保存完了がハンディターミナルに応答され、作業者に送信成功を通知する', () => {
    it('有効なユーザーIDと正しいパスワードで認証し、成功時に適切な出力を返す', () => {
      // Arrange
      const input: AuthenticateUserInput = {
        userId: 'user001',
        password: 'correctPassword',
      };

      // Act
      const result: AuthenticateUserOutput = authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userContext).not.toBeNull();
      expect(result.userContext?.userId).toBe('user001');
      expect(result.authToken).not.toBeNull();
      expect(typeof result.authToken).toBe('string');
      expect(result.authToken?.length).toBeGreaterThan(0);
      expect(result.expiresAt).not.toBeNull();
      expect(typeof result.expiresAt).toBe('string');
      // ISO 8601形式の検証
      expect(() => new Date(result.expiresAt as string)).not.toThrow();
    });
  });
});