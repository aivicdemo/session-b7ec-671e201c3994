import { getHandyTerminalSyncLogById } from '../../src/logic/data-persistence';

describe('SCEN-1076: getHandyTerminalSyncLogById - Non-existent ハンディターミナル連携ログID', () => {
  it('should throw HandyTerminalSyncLogNotFound error when ハンディターミナル連携ログID does not exist in database', async () => {
    const nonExistentSyncLogId = 'non-existent-sync-log-id-12345';

    const input = {
      handyTerminalSyncLogId: nonExistentSyncLogId,
    };

    try {
      await getHandyTerminalSyncLogById(input);
      fail('Expected HandyTerminalSyncLogNotFound error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).name).toBe('HandyTerminalSyncLogNotFound');
      expect((error as any).message).toBe(
        `ハンディターミナル連携ログID ${nonExistentSyncLogId} は見つかりません。`,
      );
    }
  });
});