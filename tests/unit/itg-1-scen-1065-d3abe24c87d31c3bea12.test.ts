import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1065: ハンディターミナル連携ログの必須フィールド検証', () => {
  describe('saveHandyTerminalSyncLog関数の必須フィールド不足エラー', () => {
    test('workerId=nullの場合、InvalidHandyTerminalSyncLogInputエラーを返す', async () => {
      const input = {
        handyTerminalSyncLogId: null,
        workerId: null,
        handyTerminalId: 'HT001',
        facilityId: 'FC001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        syncContent: '{}',
        createdBy: 'USER001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow(
        'ハンディターミナル連携ログの必須フィールドが不足しています。'
      );
    });

    test('handyTerminalId=undefinedの場合、InvalidHandyTerminalSyncLogInputエラーを返す', async () => {
      const input = {
        handyTerminalSyncLogId: null,
        workerId: 'WK001',
        handyTerminalId: undefined,
        facilityId: 'FC001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        syncContent: '{}',
        createdBy: 'USER001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow(
        'ハンディターミナル連携ログの必須フィールドが不足しています。'
      );
    });

    test('facilityId=空文字列の場合、InvalidHandyTerminalSyncLogInputエラーを返す', async () => {
      const input = {
        handyTerminalSyncLogId: null,
        workerId: 'WK001',
        handyTerminalId: 'HT001',
        facilityId: '',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        syncContent: '{}',
        createdBy: 'USER001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow(
        'ハンディターミナル連携ログの必須フィールドが不足しています。'
      );
    });

    test('syncType=nullの場合、InvalidHandyTerminalSyncLogInputエラーを返す', async () => {
      const input = {
        handyTerminalSyncLogId: null,
        workerId: 'WK001',
        handyTerminalId: 'HT001',
        facilityId: 'FC001',
        syncType: null,
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:30:00Z',
        syncContent: '{}',
        createdBy: 'USER001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow(
        'ハンディターミナル連携ログの必須フィールドが不足しています。'
      );
    });

    test('syncStatus=undefinedの場合、InvalidHandyTerminalSyncLogInputエラーを返す', async () => {
      const input = {
        handyTerminalSyncLogId: null,
        workerId: 'WK001',
        handyTerminalId: 'HT001',
        facilityId: 'FC001',
        syncType: 'work_result',
        syncStatus: undefined,
        sentDateTime: '2024-01-15T10:30:00Z',
        syncContent: '{}',
        createdBy: 'USER001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow(
        'ハンディターミナル連携ログの必須フィールドが不足しています。'
      );
    });

    test('sentDateTime=空文字列の場合、InvalidHandyTerminalSyncLogInputエラーを返す', async () => {
      const input = {
        handyTerminalSyncLogId: null,
        workerId: 'WK001',
        handyTerminalId: 'HT001',
        facilityId: 'FC001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '',
        syncContent: '{}',
        createdBy: 'USER001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow(
        'ハンディターミナル連携ログの必須フィールドが不足しています。'
      );
    });
  });
});