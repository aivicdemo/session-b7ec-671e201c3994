import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-874: listAllocationExecutionStatusByCondition - ページサイズが0以下の場合のエラー処理', () => {
  it('ページサイズが0の場合にInvalidConditionFormatErrorを発生させる', async () => {
    const input = {
      pageSize: 0,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toMatchObject({
      name: 'InvalidConditionFormatError',
      message: expect.stringContaining('検索条件の形式が不正です'),
    });
  });

  it('ページサイズが負数の場合にInvalidConditionFormatErrorを発生させる', async () => {
    const input = {
      pageSize: -1,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toMatchObject({
      name: 'InvalidConditionFormatError',
      message: expect.stringContaining('検索条件の形式が不正です'),
    });
  });

  it('エラーメッセージに期待値の指導内容を含む', async () => {
    const input = {
      pageSize: 0,
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('例外が発生すべき');
    } catch (error: any) {
      expect(error.message).toContain('日時はISO8601形式');
      expect(error.message).toContain('ページ番号は1以上');
      expect(error.message).toContain('ページサイズは1以上');
    }
  });
});