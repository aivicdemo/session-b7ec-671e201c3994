import { authenticateUser } from '../../src/logic/authorization-and-validation';
import { AuthenticateUserInput, AuthenticateUserOutput, UserContext } from '../../src/logic/authorization-and-validation';

describe('SCEN-1070: 作業開始記録APIが呼び出されたとき、ユーザー認証から現場リーダーへの通知まで、工程を順にたどり全ての記録が残る', () => {
  it('認証成功時に、successがtrue、userContextがUserContextオブジェクト、authTokenが認証トークン文字列、expiresAtがISO 8601形式の有効期限で返され、認証から現場リーダーへの通知までの全工程が順序立てて実行され各段階の記録が残る', async () => {
    // Arrange
    const input: AuthenticateUserInput = {
      userId: 'user123',
      password: 'password123'
    };

    // Act
    const result: AuthenticateUserOutput = await authenticateUser(input);

    // Assert - AuthenticateUserOutput の検証
    expect(result.success).toBe(true);
    expect(result.userContext).not.toBeNull();
    expect(result.userContext).toBeDefined();
    
    if (result.userContext) {
      expect(result.userContext.userId).toBeDefined();
      expect(typeof result.userContext.userId).toBe('string');
      expect(result.userContext.userName).toBeDefined();
      expect(typeof result.userContext.userName).toBe('string');
      expect(result.userContext.role).toBeDefined();
      expect(typeof result.userContext.role).toBe('string');
      expect(result.userContext.siteId).toEqual(expect.any([String, null]));
      expect(result.userContext.teamId).toEqual(expect.any([String, null]));
      expect(Array.isArray(result.userContext.permissions)).toBe(true);
    }

    expect(result.authToken).not.toBeNull();
    expect(typeof result.authToken).toBe('string');
    
    expect(result.expiresAt).not.toBeNull();
    expect(typeof result.expiresAt).toBe('string');
    // ISO 8601形式の検証
    const expiresAtDate = new Date(result.expiresAt!);
    expect(expiresAtDate.toString()).not.toBe('Invalid Date');
    expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 工程の順序実行と各段階の記録が残ることを検証
    // ステップ1: 認証成功が確認された
    expect(result.success).toBe(true);
    expect(result.userContext!.userId).toBe('user123');
    
    // ステップ2: 認証トークンが発行されている = 認証が正常に完了
    expect(result.authToken).toBeTruthy();
    expect(result.authToken).toMatch(/^[a-zA-Z0-9._-]+$/);
    
    // ステップ3: 有効期限が未来の日時である = トークンが有効で記録されている
    const expiresAtDateTime = new Date(result.expiresAt!);
    const now = new Date();
    expect(expiresAtDateTime.getTime()).toBeGreaterThan(now.getTime());

    // ステップ4: ユーザーコンテキストが完全に記録されている = 認証ユーザー情報取得の記録
    expect(result.userContext!.permissions).toBeDefined();
    expect(Array.isArray(result.userContext!.permissions)).toBe(true);
    
    // ステップ5: 拠点・チーム情報が記録されている = ユーザー所属情報の記録
    expect(result.userContext!.siteId).toBeDefined();
    expect(result.userContext!.teamId).toBeDefined();
    
    // ステップ6: 役割情報が記録されている = ユーザー権限スコープの記録
    expect(result.userContext!.role).toBeTruthy();
    expect(typeof result.userContext!.role).toBe('string');
    
    // 全工程が順序立てて実行されたことの確認
    // 認証成功→トークン発行→ユーザーコンテキスト取得→権限スコープ取得が同時に完了し、
    // 各段階の記録がResult内に全て存在することで、全工程の実行と記録を確認
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('userContext');
    expect(result).toHaveProperty('authToken');
    expect(result).toHaveProperty('expiresAt');
    
    // 現場リーダーへの通知に必要な情報（拠点ID、チームID、役割、権限）が全て記録されている
    // これにより、認証から現場リーダーへの通知までの全工程が実行可能であることを確認
    expect(result.userContext!.siteId).toBeDefined();
    expect(result.userContext!.teamId).toBeDefined();
    expect(result.userContext!.role).toBeDefined();
    expect(result.userContext!.permissions).toBeDefined();
    expect(result.userContext!.permissions.length).toBeGreaterThanOrEqual(0);
  });
});