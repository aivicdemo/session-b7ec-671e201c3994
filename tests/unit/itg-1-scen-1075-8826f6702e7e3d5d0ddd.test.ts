import { getHandyTerminalSyncLogById } from '../../src/logic/data-persistence';
import { GetHandyTerminalSyncLogByIdInput } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-1075', () => {
  describe('getHandyTerminalSyncLogById - 入力されたハンディターミナル連携ログIDがundefinedの場合', () => {
    it('InvalidHandyTerminalSyncLogIdエラーが発生する', async () => {
      const input: GetHandyTerminalSyncLogByIdInput = {
        handyTerminalSyncLogId: undefined as any,
      };

      try {
        await getHandyTerminalSyncLogById(input);
        fail('エラーがスローされるべきです');
      } catch (error: any) {
        expect(error.name).toBe('InvalidHandyTerminalSyncLogId');
        expect(error.message).toBe('ハンディターミナル連携ログIDは必須です。');
      }
    });
  });
});