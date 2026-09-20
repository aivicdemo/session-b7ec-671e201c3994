import { authorizeUserAction } from '../../src/logic/authorization-and-validation';

describe('SCEN-711: 認証済みの一般ユーザーが許可されたアクション・リソースにアクセスすると権限判定が承認され適用可能権限が返される', () => {
  it('should authorize general_user to view_productivity_data for their own site', async () => {
    // テスト用の認証済みユーザーコンテキストを準備する
    const userContext = {
      userId: 'user001',
      userName: 'Test User',
      role: 'general_user',
      siteId: 'site_A',
      teamId: 'team_01',
      permissions: ['view_productivity_data']
    };

    // authorizeUserActionを呼び出す
    const result = await authorizeUserAction({
      userContext,
      requiredAction: 'view_productivity_data',
      resourceType: 'productivity_data',
      resourceId: 'prod_001',
      targetSiteId: 'site_A',
      targetTeamId: null,
      targetDepartmentId: null
    });

    // 戻り値の authorized フィールドを検証する
    expect(result.authorized).toBe(true);

    // 戻り値の denialReason フィールドを検証する
    expect(result.denialReason).toBeNull();

    // 戻り値の applicablePermissions フィールドを検証する
    expect(result.applicablePermissions).toContain('view_productivity_data');
  });
});