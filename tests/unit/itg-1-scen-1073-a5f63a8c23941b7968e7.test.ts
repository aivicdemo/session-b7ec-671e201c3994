import { getHandyTerminalSyncLogById } from '../../src/logic/data-persistence';

describe('SCEN-1073: getHandyTerminalSyncLogById - Empty handyTerminalSyncLogId handling', () => {
  it('should throw InvalidHandyTerminalSyncLogId error when handyTerminalSyncLogId is empty string', async () => {
    const input = {
      handyTerminalSyncLogId: '',
    };

    await expect(getHandyTerminalSyncLogById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidHandyTerminalSyncLogId',
        message: 'ハンディターミナル連携ログIDは必須です。',
      })
    );
  });
});