import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1028: 日次バッチ処理実行時の異常値検出と現場リーダーへの提示', () => {
  it('現場リーダーが認証され、権限スコープに拠点・チーム情報を含むコンテキストが返される', async () => {
    const result = await authenticateUser({
      userId: 'leader001',
      password: 'correctPassword',
    });

    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext?.role).toBe('現場リーダー');
    expect(result.authToken).not.toBeNull();
    expect(result.expiresAt).not.toBeNull();

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.expiresAt).toMatch(iso8601Regex);

    if (result.userContext) {
      expect(result.userContext.permissions).toBeDefined();
      expect(Array.isArray(result.userContext.permissions)).toBe(true);
      expect(result.userContext.siteId).toBeDefined();
      expect(result.userContext.teamId).toBeDefined();
    }
  });
});