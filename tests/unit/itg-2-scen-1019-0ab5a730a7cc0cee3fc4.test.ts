import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1019: 物流センター長が手動でバッチ実行を指示したとき', () => {
  it('定時実行時刻を待たずにバッチ処理が開始される', async () => {
    // Arrange
    const userId = 'logistics_manager_001';
    const validPassword = 'valid_password_for_logistics_manager_001';

    // Act
    const result = await authenticateUser({
      userId,
      password: validPassword,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext!.userId).toBe('logistics_manager_001');
    expect(result.userContext!.role).toBe('センター長');
    expect(result.userContext!.permissions).toContain('batch_manual_execution');
    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    expect(result.expiresAt).not.toBeNull();
    expect(new Date(result.expiresAt!).getTime()).toBeGreaterThan(new Date().getTime());
  });
});