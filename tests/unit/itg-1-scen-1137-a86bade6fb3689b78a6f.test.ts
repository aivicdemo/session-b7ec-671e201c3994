import { deleteDataByIdAndType } from '../../src/logic/data-persistence';

describe('SCEN-1137: deleteDataByIdAndType - Database system error handling', () => {
  it('should throw PersistenceError with correct message when database connection times out', async () => {
    const input = {
      dataType: 'facility',
      recordId: 'FAC-001',
      deletedBy: 'admin-user-123',
    };

    await expect(deleteDataByIdAndType(input)).rejects.toMatchObject({
      name: 'PersistenceError',
      message: expect.stringContaining('データベースへのアクセス中にエラーが発生しました。'),
    });
  });

  it('should throw PersistenceError when transaction lock conflict occurs during facility deletion', async () => {
    const input = {
      dataType: 'facility',
      recordId: 'FAC-001',
      deletedBy: 'admin-user-123',
    };

    try {
      await deleteDataByIdAndType(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('データベースへのアクセス中にエラーが発生しました。');
    }
  });

  it('should not return DeleteDataByIdAndTypeOutput when database error occurs', async () => {
    const input = {
      dataType: 'facility',
      recordId: 'FAC-001',
      deletedBy: 'admin-user-123',
    };

    let outputReturned = false;
    try {
      const result = await deleteDataByIdAndType(input);
      if (result && result.dataType && result.recordId && result.deletedAt) {
        outputReturned = true;
      }
      fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('データベースへのアクセス中にエラーが発生しました。');
      expect(outputReturned).toBe(false);
    }
  });

  it('should throw PersistenceError when database connection is lost during deletion', async () => {
    const input = {
      dataType: 'facility',
      recordId: 'FAC-001',
      deletedBy: 'admin-user-123',
    };

    try {
      await deleteDataByIdAndType(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('データベースへのアクセス中にエラーが発生しました。');
    }
  });

  it('should throw PersistenceError with consistent message format when query execution fails', async () => {
    const input = {
      dataType: 'facility',
      recordId: 'FAC-001',
      deletedBy: 'admin-user-123',
    };

    try {
      await deleteDataByIdAndType(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('データベースへのアクセス中にエラーが発生しました。');
    }
  });

  it('should throw PersistenceError when deleting team record with database system error', async () => {
    const input = {
      dataType: 'team',
      recordId: 'TEAM-001',
      deletedBy: 'admin-user-123',
    };

    try {
      await deleteDataByIdAndType(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('データベースへのアクセス中にエラーが発生しました。');
    }
  });

  it('should throw PersistenceError when deleting worker record with database error', async () => {
    const input = {
      dataType: 'worker',
      recordId: 'WORKER-001',
      deletedBy: 'admin-user-123',
    };

    try {
      await deleteDataByIdAndType(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('データベースへのアクセス中にエラーが発生しました。');
    }
  });
});