import { saveHandyTerminalSyncLog, SaveHandyTerminalSyncLogInput } from '../../src/logic/data-persistence';

describe('SCEN-1068: ハンディターミナル連携ログ新規作成・更新時の連携タイプ検証', () => {
  describe('syncTypeが定義済み値でない場合', () => {
    it('連携タイプが無効な値の場合、InvalidSyncTypeValueエラーを返す', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-001',
        handyTerminalId: 'terminal-001',
        facilityId: 'facility-001',
        syncType: 'invalid_sync_type',
        syncStatus: 'pending',
        sentDateTime: '2024-01-15T10:30:00Z',
        createdBy: 'user-001',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow();
      await expect(saveHandyTerminalSyncLog(input)).rejects.toMatchObject({
        code: 'InvalidSyncTypeValue',
        message: expect.stringContaining('連携タイプが無効です'),
      });
    });

    it('連携タイプが空文字列の場合、InvalidSyncTypeValueエラーを返す', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-002',
        handyTerminalId: 'terminal-002',
        facilityId: 'facility-002',
        syncType: '',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T11:00:00Z',
        createdBy: 'user-002',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow();
      await expect(saveHandyTerminalSyncLog(input)).rejects.toMatchObject({
        code: 'InvalidSyncTypeValue',
        message: expect.stringContaining('連携タイプが無効です'),
      });
    });

    it('連携タイプが "unknown" の場合、InvalidSyncTypeValueエラーを返す', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-003',
        handyTerminalId: 'terminal-003',
        facilityId: 'facility-003',
        syncType: 'unknown',
        syncStatus: 'failure',
        sentDateTime: '2024-01-15T12:15:00Z',
        createdBy: 'user-003',
      };

      await expect(saveHandyTerminalSyncLog(input)).rejects.toThrow();
      await expect(saveHandyTerminalSyncLog(input)).rejects.toMatchObject({
        code: 'InvalidSyncTypeValue',
        message: expect.stringContaining('連携タイプが無効です'),
      });
    });

    it('定義済み値（work_result）を指定した場合は、エラーが発生しない', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-004',
        handyTerminalId: 'terminal-004',
        facilityId: 'facility-004',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T13:45:00Z',
        createdBy: 'user-004',
      };

      const result = await saveHandyTerminalSyncLog(input);
      expect(result).toBeDefined();
      expect(result.isNewRecord).toBe(true);
    });

    it('定義済み値（position_update）を指定した場合は、エラーが発生しない', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-005',
        handyTerminalId: 'terminal-005',
        facilityId: 'facility-005',
        syncType: 'position_update',
        syncStatus: 'pending',
        sentDateTime: '2024-01-15T14:20:00Z',
        createdBy: 'user-005',
      };

      const result = await saveHandyTerminalSyncLog(input);
      expect(result).toBeDefined();
      expect(result.isNewRecord).toBe(true);
    });

    it('定義済み値（status_change）を指定した場合は、エラーが発生しない', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-006',
        handyTerminalId: 'terminal-006',
        facilityId: 'facility-006',
        syncType: 'status_change',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T15:00:00Z',
        createdBy: 'user-006',
      };

      const result = await saveHandyTerminalSyncLog(input);
      expect(result).toBeDefined();
      expect(result.isNewRecord).toBe(true);
    });

    it('定義済み値（error_report）を指定した場合は、エラーが発生しない', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-007',
        handyTerminalId: 'terminal-007',
        facilityId: 'facility-007',
        syncType: 'error_report',
        syncStatus: 'retry',
        sentDateTime: '2024-01-15T16:30:00Z',
        createdBy: 'user-007',
      };

      const result = await saveHandyTerminalSyncLog(input);
      expect(result).toBeDefined();
      expect(result.isNewRecord).toBe(true);
    });

    it('無効な連携タイプでレコードが保存されないことを確認する', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        workerId: 'worker-008',
        handyTerminalId: 'terminal-008',
        facilityId: 'facility-008',
        syncType: 'unsupported_sync_type',
        syncStatus: 'pending',
        sentDateTime: '2024-01-15T17:00:00Z',
        createdBy: 'user-008',
      };

      try {
        await saveHandyTerminalSyncLog(input);
        fail('エラーが発生すべき');
      } catch (error: unknown) {
        expect(error).toBeDefined();
        if (error instanceof Error && 'code' in error) {
          expect((error as Record<string, unknown>).code).toBe('InvalidSyncTypeValue');
        }
      }
    });
  });
});