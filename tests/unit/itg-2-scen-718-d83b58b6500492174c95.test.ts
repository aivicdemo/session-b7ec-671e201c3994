import { authorizeUserAction } from '../../src/logic/authorization-and-validation';

describe('SCEN-718: ロールベースアクセス制御 - チームスコープ外リソースアクセス拒否', () => {
  it('対象チームIDが指定されてユーザーのチームスコープ外の場合に拒否される', () => {
    // userContext を生成
    const userContext = {
      userId: 'user-001',
      userName: 'Test User',
      role: 'team_leader',
      siteId: 'site-A',
      teamId: 'team-1',
      permissions: ['view_productivity_data', 'create_placement_plan'],
    };

    // 入力パラメータを設定
    const requiredAction = 'view_productivity_data';
    const resourceType = 'productivity_data';
    const targetTeamId = 'team-2'; // ユーザーのチームスコープ外
    const resourceId = null;
    const targetSiteId = null;

    // authorizeUserAction を呼び出す
    const result = authorizeUserAction({
      userContext,
      requiredAction,
      resourceType,
      resourceId,
      targetSiteId,
      targetTeamId,
    });

    // 期待結果を検証
    expect(result.authorized).toBe(false);
    expect(result.denialReason).toBe('out_of_scope');
    expect(result.applicablePermissions).toContain('view_productivity_data');
    expect(result.applicablePermissions).toContain('create_placement_plan');
  });
});