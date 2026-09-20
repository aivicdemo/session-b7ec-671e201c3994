import { authorizeUserAction } from '../../src/logic/authorization-and-validation';

describe('SCEN-712: ユーザーコンテキストがnullまたはundefinedの場合にInvalidUserContextErrorが発生する', () => {
  it('userContextがnullの場合、InvalidUserContextErrorが発生する', () => {
    const input = {
      userContext: null,
      requiredAction: 'create_placement_plan',
      resourceType: 'placement_plan',
      resourceId: null,
      targetSiteId: null,
      targetTeamId: null,
      targetDepartmentId: null,
    };

    expect(() => {
      authorizeUserAction(input);
    }).toThrow();

    try {
      authorizeUserAction(input);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('ユーザーコンテキストが無効です。認証を再実行してください。');
    }
  });
});