import { authenticateUser } from '../../src/logic/auth-authorization-audit';
import { AuthenticateUserInput, UserAuthData, AuthenticateUserOutput } from '../../src/logic/auth-authorization-audit';
import crypto from 'crypto';

describe('SCEN-346: 正規のユーザーIDとパスワードで認証するとセッショントークンと認証済みユーザー情報が返却される', () => {
  let testPassword: string;
  let passwordHash: string;
  let userAuthData: UserAuthData;

  beforeEach(() => {
    // ステップ1: 正規のユーザーレコードおよび認証データを準備
    testPassword = 'TestPassword123!@#';
    
    // ステップ2: パスワードをハッシュ化
    passwordHash = crypto
      .createHash('sha256')
      .update(testPassword)
      .digest('hex');
    
    userAuthData = {
      userId: 'user001',
      userName: '山田太郎',
      passwordHash: passwordHash,
      status: 'active',
      role: '現場リーダー',
      facilityId: 'facility-001',
      teamId: 'team-001'
    };
  });

  it('正規のユーザーIDとパスワードで認証すると、セッショントークンと認証済みユーザー情報が返却される', async () => {
    // ステップ3: authenticateUser()を呼び出す
    const input: AuthenticateUserInput = {
      userId: 'user001',
      passwordPlaintext: testPassword,
      ipAddress: '192.168.1.100',
      userAuthData: userAuthData
    };

    const result = await authenticateUser(input);

    // ステップ4: 戻り値の型がAuthenticateUserOutputであることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('sessionToken');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('userName');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('sessionExpiresAt');

    // ステップ5: sessionTokenが空でない文字列であることを確認
    expect(typeof result.sessionToken).toBe('string');
    expect(result.sessionToken.length).toBeGreaterThan(0);

    // ステップ6: userIdが'user001'であることを確認
    expect(result.userId).toBe('user001');

    // ステップ7: userNameが'山田太郎'であることを確認
    expect(result.userName).toBe('山田太郎');

    // ステップ8: roleが'現場リーダー'であることを確認
    expect(result.role).toBe('現場リーダー');

    // ステップ9: facilityIdが'facility-001'であることを確認
    expect(result.facilityId).toBe('facility-001');

    // ステップ10: teamIdが'team-001'であることを確認
    expect(result.teamId).toBe('team-001');

    // ステップ11: sessionExpiresAtがISO 8601形式で、現在時刻より未来であることを確認
    expect(typeof result.sessionExpiresAt).toBe('string');
    const expiresAtDate = new Date(result.sessionExpiresAt);
    expect(expiresAtDate.toString()).not.toBe('Invalid Date');
    // ISO 8601形式の確認（基本的なチェック）
    expect(result.sessionExpiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // 未来の時刻であることを確認
    expect(expiresAtDate.getTime()).toBeGreaterThan(new Date().getTime());
  });
});