import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1067: saveHandyTerminalSyncLog - Invalid Sync Status', () => {
  it('should return InvalidSyncStatusValue error when syncStatus is not one of pending, success, failure, retry', async () => {
    const input = {
      handyTerminalSyncLogId: null,
      workerId: 'worker-001',
      handyTerminalId: 'terminal-001',
      facilityId: 'facility-001',
      syncType: 'work_result',
      workInstructionId: 'instruction-001',
      syncContent: '{"data": "sample"}',
      syncStatus: 'invalid_status',
      errorMessage: null,
      sentDateTime: '2024-01-15T10:30:00Z',
      receivedDateTime: '2024-01-15T10:30:05Z',
      processingCompletedDateTime: null,
      retryCount: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    try {
      await saveHandyTerminalSyncLog(input);
      fail('Expected InvalidSyncStatusValue error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidSyncStatusValue');
      expect(error.message).toBe('連携ステータスが無効です。');
    }
  });

  it('should not return SaveHandyTerminalSyncLogOutput when syncStatus is invalid', async () => {
    const input = {
      handyTerminalSyncLogId: null,
      workerId: 'worker-001',
      handyTerminalId: 'terminal-001',
      facilityId: 'facility-001',
      syncType: 'work_result',
      workInstructionId: 'instruction-001',
      syncContent: '{"data": "sample"}',
      syncStatus: 'unknown',
      errorMessage: null,
      sentDateTime: '2024-01-15T10:30:00Z',
      receivedDateTime: '2024-01-15T10:30:05Z',
      processingCompletedDateTime: null,
      retryCount: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    let result;
    try {
      result = await saveHandyTerminalSyncLog(input);
    } catch (error) {
      expect(error.name).toBe('InvalidSyncStatusValue');
    }
    expect(result).toBeUndefined();
  });
});