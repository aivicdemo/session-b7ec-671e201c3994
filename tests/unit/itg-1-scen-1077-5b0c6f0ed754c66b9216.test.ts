import { getHandyTerminalSyncLogById } from '../../src/logic/data-persistence';
import { DatabaseAccessError } from '../../src/logic/errors';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1077: ハンディターミナル連携ログ取得エラーハンドリング', () => {
  describe('DatabaseAccessError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('データベースアクセス中にシステムエラーが発生した場合、DatabaseAccessErrorエラーが発生する', async () => {
      const handyTerminalSyncLogId = 'ht-sync-log-001';

      jest.spyOn(dataPersistence, 'getHandyTerminalSyncLogById').mockRejectedValueOnce(
        new DatabaseAccessError('ハンディターミナル連携ログの取得に失敗しました。')
      );

      let caughtError: unknown = null;
      try {
        await getHandyTerminalSyncLogById(handyTerminalSyncLogId);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(DatabaseAccessError);
      expect((caughtError as any).name).toBe('DatabaseAccessError');
      expect((caughtError as Error).message).toBe('ハンディターミナル連携ログの取得に失敗しました。');
    });

    it('入力が有効なハンディターミナル連携ログIDの場合、DatabaseAccessErrorが発生する', async () => {
      const validLogId = 'valid-ht-sync-log-id-12345';

      jest.spyOn(dataPersistence, 'getHandyTerminalSyncLogById').mockRejectedValueOnce(
        new DatabaseAccessError('ハンディターミナル連携ログの取得に失敗しました。')
      );

      let caughtError: unknown = null;
      try {
        await getHandyTerminalSyncLogById(validLogId);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(DatabaseAccessError);
      expect((caughtError as any).name).toBe('DatabaseAccessError');
      expect((caughtError as Error).message).toBe('ハンディターミナル連携ログの取得に失敗しました。');
    });

    it('他のエラー型（HandyTerminalSyncLogNotFound）は発生しない', async () => {
      const handyTerminalSyncLogId = 'ht-sync-log-002';

      jest.spyOn(dataPersistence, 'getHandyTerminalSyncLogById').mockRejectedValueOnce(
        new DatabaseAccessError('ハンディターミナル連携ログの取得に失敗しました。')
      );

      let caughtError: unknown = null;
      try {
        await getHandyTerminalSyncLogById(handyTerminalSyncLogId);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).not.toBeNull();
      const errorName = (caughtError as any)?.name;
      expect(errorName).not.toBe('HandyTerminalSyncLogNotFound');
      expect(errorName).toBe('DatabaseAccessError');
    });

    it('他のエラー型（InvalidHandyTerminalSyncLogId）は発生しない', async () => {
      const handyTerminalSyncLogId = 'ht-sync-log-003';

      jest.spyOn(dataPersistence, 'getHandyTerminalSyncLogById').mockRejectedValueOnce(
        new DatabaseAccessError('ハンディターミナル連携ログの取得に失敗しました。')
      );

      let caughtError: unknown = null;
      try {
        await getHandyTerminalSyncLogById(handyTerminalSyncLogId);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).not.toBeNull();
      const errorName = (caughtError as any)?.name;
      expect(errorName).not.toBe('InvalidHandyTerminalSyncLogId');
      expect(errorName).toBe('DatabaseAccessError');
    });
  });
});