import { authenticateUser } from '../../src/logic/authorization-and-validation';
import type { AuthenticateUserInput, AuthenticateUserOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1063: WES・WMSデータ取得失敗時フォールバック - 認証・権限確認', () => {
  describe('authenticateUser', () => {
    it('認証・権限確認を通過し、有効なユーザーの認証トークンと有効期限を返す', async () => {
      // Arrange
      const input: AuthenticateUserInput = {
        userId: 'valid-user-id',
        password: 'correct-password'
      };

      // Act
      const result: AuthenticateUserOutput = await authenticateUser(input);

      // Assert - 認証成功の確認
      expect(result.success).toBe(true);

      // Assert - ユーザーコンテキストが存在し、必要なフィールドを含むことを確認
      expect(result.userContext).not.toBeNull();
      expect(result.userContext).toBeDefined();
      if (result.userContext) {
        expect(result.userContext.userId).toBeDefined();
        expect(typeof result.userContext.userId).toBe('string');
        expect(result.userContext.userId.length).toBeGreaterThan(0);

        expect(result.userContext.userName).toBeDefined();
        expect(typeof result.userContext.userName).toBe('string');

        expect(result.userContext.role).toBeDefined();
        expect(typeof result.userContext.role).toBe('string');

        // 拠点IDとチームID、権限スコープが存在
        expect(result.userContext.siteId).toBeDefined();
        expect(result.userContext.teamId).toBeDefined();
        expect(result.userContext.permissions).toBeDefined();
        expect(Array.isArray(result.userContext.permissions)).toBe(true);
      }

      // Assert - 認証トークンがISO 8601形式の有効期限と共に生成されていることを確認
      expect(result.authToken).not.toBeNull();
      expect(result.authToken).toBeDefined();
      expect(typeof result.authToken).toBe('string');
      expect(result.authToken.length).toBeGreaterThan(0);

      expect(result.expiresAt).not.toBeNull();
      expect(result.expiresAt).toBeDefined();
      expect(typeof result.expiresAt).toBe('string');

      // ISO 8601形式の確認（基本的な検証）
      const expiresAtDate = new Date(result.expiresAt);
      expect(expiresAtDate).toBeInstanceOf(Date);
      expect(expiresAtDate.getTime()).toBeGreaterThan(Date.now());

      // ISO 8601形式であることを確認（正規表現による検証）
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(result.expiresAt).toMatch(iso8601Regex);
    });

    it('有効なユーザーIDと正しいパスワードで認証成功時、エラーは発生しない', async () => {
      // Arrange
      const input: AuthenticateUserInput = {
        userId: 'valid-user-id',
        password: 'correct-password'
      };

      // Act & Assert - エラーが発生しないことを確認
      await expect(authenticateUser(input)).resolves.not.toThrow();
    });

    it('認証成功時、userContextに認証済みユーザーのコンテキスト情報が完全に含まれる', async () => {
      // Arrange
      const input: AuthenticateUserInput = {
        userId: 'valid-user-id',
        password: 'correct-password'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert - 認証成功時のみユーザーコンテキストが存在
      expect(result.success).toBe(true);
      expect(result.userContext).not.toBeNull();

      if (result.userContext) {
        // ユーザーID、ユーザー名、役割が設定されていることを確認
        expect(result.userContext.userId).toEqual(input.userId);
        expect(result.userContext.userName).toBeDefined();
        expect(result.userContext.role).toBeDefined();

        // 拠点・チーム・権限スコープの情報が存在することを確認
        expect('siteId' in result.userContext).toBe(true);
        expect('teamId' in result.userContext).toBe(true);
        expect('permissions' in result.userContext).toBe(true);
      }
    });

    it('認証成功時、authTokenは生成された認証トークン文字列である', async () => {
      // Arrange
      const input: AuthenticateUserInput = {
        userId: 'valid-user-id',
        password: 'correct-password'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.authToken).not.toBeNull();
      expect(typeof result.authToken).toBe('string');
      expect(result.authToken).toMatch(/^[A-Za-z0-9\-_.]+$/);
    });

    it('認証成功時、expiresAtはISO 8601形式の有効期限文字列である', async () => {
      // Arrange
      const input: AuthenticateUserInput = {
        userId: 'valid-user-id',
        password: 'correct-password'
      };

      // Act
      const result = await authenticateUser(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.expiresAt).not.toBeNull();
      expect(typeof result.expiresAt).toBe('string');

      // ISO 8601フォーマットの検証
      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;
      expect(result.expiresAt).toMatch(iso8601Pattern);

      // 有効期限が現在時刻より後であることを確認
      const expiresAtTime = new Date(result.expiresAt).getTime();
      const now = Date.now();
      expect(expiresAtTime).toBeGreaterThan(now);
    });
  });
});