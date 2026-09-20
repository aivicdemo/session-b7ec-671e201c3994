import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';
import type { SaveHandyTerminalSyncLogInput, SaveHandyTerminalSyncLogOutput } from '../../src/logic/data-persistence';

describe('SCEN-1071: ハンディターミナル連携ログ - 任意フィールドのnull/undefined処理', () => {
  describe('saveHandyTerminalSyncLog with optional fields as null/undefined', () => {
    it('should successfully process input with all optional fields as null and undefined', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'worker-001',
        handyTerminalId: 'terminal-001',
        facilityId: 'facility-001',
        syncType: 'work_result',
        workInstructionId: undefined,
        syncContent: JSON.stringify({ quantity: 100, status: 'completed' }),
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T10:30:00Z',
        receivedDateTime: undefined,
        processingCompletedDateTime: null,
        retryCount: undefined,
        createdBy: 'user-001',
        updatedBy: null,
      };

      const result: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(input);

      expect(result).toBeDefined();
      expect(result.handyTerminalSyncLogId).toBeDefined();
      expect(typeof result.handyTerminalSyncLogId).toBe('string');
      expect(result.workerId).toBe(input.workerId);
      expect(result.handyTerminalId).toBe(input.handyTerminalId);
      expect(result.facilityId).toBe(input.facilityId);
      expect(result.syncType).toBe(input.syncType);
      expect(result.syncStatus).toBe(input.syncStatus);
      expect(result.savedAt).toBeDefined();
      expect(typeof result.savedAt).toBe('string');
      expect(result.isNewRecord).toBe(true);
    });

    it('should handle mix of null, undefined, and valid values for optional fields', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: undefined,
        workerId: 'worker-002',
        handyTerminalId: 'terminal-002',
        facilityId: 'facility-002',
        syncType: 'position_update',
        workInstructionId: 'instruction-123',
        syncContent: JSON.stringify({ latitude: 35.6762, longitude: 139.6503 }),
        syncStatus: 'success',
        errorMessage: undefined,
        sentDateTime: '2024-01-15T11:00:00Z',
        receivedDateTime: '2024-01-15T11:00:05Z',
        processingCompletedDateTime: null,
        retryCount: 0,
        createdBy: 'user-002',
        updatedBy: undefined,
      };

      const result: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(input);

      expect(result.workerId).toBe('worker-002');
      expect(result.handyTerminalId).toBe('terminal-002');
      expect(result.facilityId).toBe('facility-002');
      expect(result.syncType).toBe('position_update');
      expect(result.isNewRecord).toBe(true);
    });

    it('should persist data correctly with optional null/undefined fields', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'worker-003',
        handyTerminalId: 'terminal-003',
        facilityId: 'facility-003',
        syncType: 'status_change',
        workInstructionId: null,
        syncContent: JSON.stringify({ previousStatus: 'pending', newStatus: 'in_progress' }),
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T12:00:00Z',
        receivedDateTime: undefined,
        processingCompletedDateTime: undefined,
        retryCount: null,
        createdBy: 'user-003',
        updatedBy: undefined,
      };

      const result: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(input);

      expect(result.handyTerminalSyncLogId).toBeDefined();
      expect(result.workerId).toBe('worker-003');
      expect(result.syncStatus).toBe('success');
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should maintain required fields integrity when optional fields are null/undefined', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: undefined,
        workerId: 'worker-004',
        handyTerminalId: 'terminal-004',
        facilityId: 'facility-004',
        syncType: 'error_report',
        workInstructionId: undefined,
        syncContent: JSON.stringify({ errorCode: 'ERR_001', description: 'Connection timeout' }),
        syncStatus: 'failure',
        errorMessage: 'Network timeout occurred',
        sentDateTime: '2024-01-15T13:00:00Z',
        receivedDateTime: null,
        processingCompletedDateTime: null,
        retryCount: undefined,
        createdBy: 'system',
        updatedBy: null,
      };

      const result: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(input);

      expect(result.workerId).toBe('worker-004');
      expect(result.facilityId).toBe('facility-004');
      expect(result.syncType).toBe('error_report');
      expect(result.syncStatus).toBe('failure');
      expect(result.isNewRecord).toBe(true);
    });

    it('should handle retry scenario with error message and null processing completion', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'worker-005',
        handyTerminalId: 'terminal-005',
        facilityId: 'facility-005',
        syncType: 'work_result',
        workInstructionId: 'instruction-456',
        syncContent: JSON.stringify({ retryAttempt: 1, data: {} }),
        syncStatus: 'retry',
        errorMessage: 'Temporary connection failure',
        sentDateTime: '2024-01-15T14:00:00Z',
        receivedDateTime: '2024-01-15T14:00:02Z',
        processingCompletedDateTime: undefined,
        retryCount: 1,
        createdBy: 'user-005',
        updatedBy: undefined,
      };

      const result: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(input);

      expect(result.isNewRecord).toBe(true);
      expect(result.syncStatus).toBe('retry');
      expect(result.handyTerminalSyncLogId).toBeDefined();
    });

    it('should return ISO 8601 formatted savedAt for newly created records', async () => {
      const input: SaveHandyTerminalSyncLogInput = {
        handyTerminalSyncLogId: null,
        workerId: 'worker-006',
        handyTerminalId: 'terminal-006',
        facilityId: 'facility-006',
        syncType: 'work_result',
        workInstructionId: null,
        syncContent: '{}',
        syncStatus: 'success',
        errorMessage: undefined,
        sentDateTime: '2024-01-15T15:00:00Z',
        receivedDateTime: undefined,
        processingCompletedDateTime: null,
        retryCount: undefined,
        createdBy: 'user-006',
        updatedBy: null,
      };

      const result: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(input);

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(result.savedAt).toMatch(isoRegex);
    });
  });
});