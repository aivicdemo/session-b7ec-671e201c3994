import { authenticateUser } from '../../src/logic/auth-authorization-audit';
import * as bcrypt from 'bcrypt';

describe('SCEN-352: 認証成功時に発行されたセッションの有効期限がISO 8601形式で返却される', () => {
  it('should return sessionExpiresAt in ISO 8601 format on successful authentication', async () => {
    // Arrange: 有効な認証データを準備
    const userId = 'user123';
    const passwordPlaintext = 'correctPassword123';
    const ipAddress = '192.168.1.100';
    
    // 正しいパスワードハッシュを生成
    const passwordHash = bcrypt.hashSync(passwordPlaintext, 10);
    
    const userAuthData = {
      userId: 'user123',
      userName: 'Test User',
      passwordHash,
      status: 'active',
      role: 'worker',
      facilityId: 'fac001',
      teamId: 'team001'
    };

    // Act: authenticateUser関数を呼び出し
    const output = await authenticateUser({
      userId,
      passwordPlaintext,
      ipAddress,
      userAuthData
    });

    // Assert: sessionExpiresAtがISO 8601形式であることを確認
    expect(output.sessionExpiresAt).toBeDefined();
    
    // ISO 8601形式の正規表現パターン（RFC 3339準拠）
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(output.sessionExpiresAt).toMatch(iso8601Pattern);

    // 有効期限が将来日時であることを確認
    const expiresAt = new Date(output.sessionExpiresAt);
    const now = new Date();
    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

    // セッションの基本情報も確認
    expect(output.sessionToken).toBeDefined();
    expect(output.userId).toBe(userId);
    expect(output.userName).toBe(userAuthData.userName);
    expect(output.role).toBe(userAuthData.role);
    expect(output.facilityId).toBe(userAuthData.facilityId);
    expect(output.teamId).toBe(userAuthData.teamId);
  });
});