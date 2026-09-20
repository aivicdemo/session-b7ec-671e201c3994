import { getHandyTerminalSyncLogById } from '../../src/logic/data-persistence';

describe('SCEN-1074: ハンディターミナル連携ログID検索エラーハンドリング', () => {
  it('入力されたハンディターミナル連携ログIDがnullの場合、InvalidHandyTerminalSyncLogIdエラーが発生する', async () => {
    const input = {
      handyTerminalSyncLogId: null as any,
    };

    await expect(getHandyTerminalSyncLogById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidHandyTerminalSyncLogIdError',
        message: 'ハンディターミナル連携ログIDは必須です。',
      })
    );
  });
});