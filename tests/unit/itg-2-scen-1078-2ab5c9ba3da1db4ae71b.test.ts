import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1078: 作業開始イベントがデータベースに正常に保存されたとき、一意の記録IDが生成される', () => {
  it('authenticateUser関数を有効なユーザー認証で呼び出した場合、success=true、userContext、authToken、expiresAtが期待値で返される', async () => {
    const input = {
      userId: 'USER001',
      password: 'password123'
    };

    const result = await authenticateUser(input);

    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext?.userId).toBe('USER001');
    expect(result.userContext?.role).toBe('worker');
    expect(result.userContext?.siteId).toBe('SITE001');
    expect(result.userContext?.teamId).toBe('TEAM001');
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.authToken?.length).toBeGreaterThan(0);
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    
    if (result.expiresAt) {
      const expiresDate = new Date(result.expiresAt);
      expect(expiresDate.toString()).not.toBe('Invalid Date');
      expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    }
  });
});