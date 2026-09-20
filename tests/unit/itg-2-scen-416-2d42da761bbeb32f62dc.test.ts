import { findUserById } from '../../src/logic/persistence-layer';

describe('SCEN-416: 存在しないユーザーIDで検索するとUserNotFoundErrorが発生する', () => {
  it('存在しないユーザーIDを指定した場合、UserNotFoundErrorが発生すること', async () => {
    const nonExistentUserId = 'non-existent-user-12345';
    const requestingUserId = 'admin-001';

    await expect(
      findUserById({
        userId: nonExistentUserId,
        requestingUserId: requestingUserId,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: `User not found with ID: ${nonExistentUserId}`,
      })
    );
  });
});