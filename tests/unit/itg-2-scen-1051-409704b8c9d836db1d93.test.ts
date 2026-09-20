import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1051: ハンディターミナルデータ受信と再試行', () => {
  describe('受信データの必須項目が不足している場合、検証エラーを返す', () => {
    test('userId が空文字列の場合、InvalidInputFormatError を返す', () => {
      // Arrange
      const input = {
        userId: '',
        password: 'valid-password-123'
      };

      // Act
      const result = authenticateUser(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userContext).toBe(null);
      expect(result.authToken).toBe(null);
      expect(result.expiresAt).toBe(null);
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('ユーザーID とパスワードは必須です。');
    });
  });
});