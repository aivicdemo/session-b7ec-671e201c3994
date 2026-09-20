import { listTeamsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-563: listTeamsByCondition with invalid pagination', () => {
  test('should return InvalidPaginationError when pageSize is less than 1', async () => {
    const input = {
      pageSize: 0,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPaginationError',
        message: 'ページネーション条件が不正です。ページ番号とページサイズは1以上である必要があります。',
      })
    );
  });
});