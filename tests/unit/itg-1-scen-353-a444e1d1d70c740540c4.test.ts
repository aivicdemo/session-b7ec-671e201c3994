import { authenticateUser } from '../../src/logic/auth-authorization-audit';

describe('SCEN-353: 異なるIPアドレスから同じユーザーが認証される場合、各々セッショントークンが異なる', () => {
  it('同じユーザーが異なるIPアドレスから認証される場合、返却されるセッショントークンが異なる', async () => {
    // ステップ1: 有効なユーザーID、パスワード、IPアドレス「192.168.1.100」、および対応するUserAuthDataを用意する
    const userId = 'test-user-001';
    const passwordPlaintext = 'TestPassword123!';
    const ipAddress1 = '192.168.1.100';
    const ipAddress2 = '203.0.113.50';

    const userAuthData = {
      userId,
      userName: 'Test User',
      passwordHash: '$2b$10$4FqpFpDrNgJ.V0nWpPJ0I.XK3KM1Fvx3C2tH5nP8jN9q7W8vC9bTK', // bcrypt hash of 'TestPassword123!'
      status: 'active',
      role: 'worker',
      facilityId: 'facility-001',
      teamId: 'team-001',
    };

    // ステップ2: authenticateUser関数を第1回目として呼び出す
    const result1 = await authenticateUser({
      userId,
      passwordPlaintext,
      ipAddress: ipAddress1,
      userAuthData,
    });

    // ステップ3: 第1回目の呼び出しから返却されたsessionTokenを「token_A」として記録する
    const token_A = result1.sessionToken;

    // ステップ4: 同じユーザーID、パスワード、異なるIPアドレス「203.0.113.50」、および同じUserAuthDataを用意する
    // (既に用意済み)

    // ステップ5: authenticateUser関数を第2回目として呼び出す
    const result2 = await authenticateUser({
      userId,
      passwordPlaintext,
      ipAddress: ipAddress2,
      userAuthData,
    });

    // ステップ6: 第2回目の呼び出しから返却されたsessionTokenを「token_B」として記録する
    const token_B = result2.sessionToken;

    // ステップ7: token_Aとtoken_Bの値を文字列比較で検証する
    expect(token_A).not.toBe(token_B);
    expect(typeof token_A).toBe('string');
    expect(typeof token_B).toBe('string');
    expect(token_A.length).toBeGreaterThan(0);
    expect(token_B.length).toBeGreaterThan(0);

    // 両セッショントークンはそれぞれ対応するIPアドレスを含む監査情報として内部で記録されている
    // 両回の呼び出しはともに同一のuserIdとuserNameとroleとfacilityIdとteamIdとsessionExpiresAtを出力する
    expect(result1.userId).toBe(userId);
    expect(result1.userName).toBe('Test User');
    expect(result1.role).toBe('worker');
    expect(result1.facilityId).toBe('facility-001');
    expect(result1.teamId).toBe('team-001');

    expect(result2.userId).toBe(userId);
    expect(result2.userName).toBe('Test User');
    expect(result2.role).toBe('worker');
    expect(result2.facilityId).toBe('facility-001');
    expect(result2.teamId).toBe('team-001');

    // セッションの有効期限は両回で同じ形式である
    expect(typeof result1.sessionExpiresAt).toBe('string');
    expect(typeof result2.sessionExpiresAt).toBe('string');
  });
});