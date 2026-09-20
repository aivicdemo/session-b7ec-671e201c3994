import { saveHandyTerminalSyncLog, DatabasePersistenceError } from '../../src/logic/data-persistence';
import { SaveHandyTerminalSyncLogInput } from '../../src/logic/data-persistence';
import { getDatabase } from '../../src/infrastructure/database';

jest.mock('../../src/infrastructure/database');

describe('SCEN-1070: ハンディターミナル連携ログの永続化エラーハンドリング', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      query: jest.fn(),
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  describe('saveHandyTerminalSyncLog', () => {
    it('データベース層がタイムアウトエラーを発生させた場合、DatabasePersistenceErrorをスローしてトランザクションがロールバックされること', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncContent: '{"result":100}',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        createdBy: 'U001',
      };

      // 1回目の呼び出し：タイムアウトエラーを発生させる
      mockDb.query.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalled();
      expect(mockDb.commit).not.toHaveBeenCalled();

      // 2回目の呼び出し：同じ入力値で再度呼び出す
      mockDb.rollback.mockClear();
      mockDb.commit.mockClear();
      mockDb.query.mockClear();
      mockDb.query.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalled();
      expect(mockDb.commit).not.toHaveBeenCalled();
    });

    it('データベース層が接続エラーを発生させた場合、DatabasePersistenceErrorをスローする', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncContent: '{"result":100}',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        createdBy: 'U001',
      };

      mockDb.query.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalled();
    });

    it('データベース層が制約違反エラーを発生させた場合、DatabasePersistenceErrorをスローする', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncContent: '{"result":100}',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        createdBy: 'U001',
      };

      const constraintError = new Error('UNIQUE constraint failed');
      constraintError.name = 'ConstraintError';
      mockDb.query.mockRejectedValueOnce(constraintError);

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalled();
    });

    it('エラー発生時にトランザクションがロールバックされており、データベースへのレコード保存が行われていないこと', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncContent: '{"result":100}',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        createdBy: 'U001',
      };

      mockDb.query.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
      }

      expect(mockDb.rollback).toHaveBeenCalled();
      expect(mockDb.commit).not.toHaveBeenCalled();

      const insertUpdateCalls = mockDb.query.mock.calls.filter(
        (call: any[]) => typeof call[0] === 'string' && (call[0].toUpperCase().includes('INSERT') || call[0].toUpperCase().includes('UPDATE'))
      );
      expect(insertUpdateCalls.length).toBe(0);
    });

    it('複数のエラーが連続で発生した場合、それぞれについてDatabasePersistenceErrorをスローして都度ロールバックされること', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncContent: '{"result":100}',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        createdBy: 'U001',
      };

      // 1回目のエラー
      mockDb.query.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalledTimes(1);

      // 2回目のエラー
      mockDb.query.mockClear();
      mockDb.rollback.mockClear();
      mockDb.commit.mockClear();
      mockDb.query.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalledTimes(1);

      // 3回目のエラー
      mockDb.query.mockClear();
      mockDb.rollback.mockClear();
      mockDb.commit.mockClear();
      mockDb.query.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      try {
        await saveHandyTerminalSyncLog(input);
        fail('DatabasePersistenceError が発生するはずです');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabasePersistenceError);
        if (error instanceof DatabasePersistenceError) {
          expect(error.message).toBe('ハンディターミナル連携ログの保存に失敗しました。');
        }
      }

      expect(mockDb.rollback).toHaveBeenCalledTimes(1);
    });
  });
});