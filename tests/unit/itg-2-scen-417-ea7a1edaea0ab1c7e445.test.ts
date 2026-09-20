import { findUserById } from '../../src/logic/persistence-layer';

describe('SCEN-417: ステータスが無効なユーザーを検索するとUserStatusInactiveErrorが発生する', () => {
  it('should throw UserStatusInactiveError when searching for an inactive user', async () => {
    const userId = 'user-inactive-001';
    const requestingUserId = 'user-admin-001';

    await expect(
      findUserById({
        userId,
        requestingUserId,
      })
    ).rejects.toThrow();

    try {
      await findUserById({
        userId,
        requestingUserId,
      });
    } catch (error) {
      expect(error).toHaveProperty('name', 'UserStatusInactiveError');
      expect(error).toHaveProperty('message', `User account is inactive: ${userId}`);
    }
  });
});