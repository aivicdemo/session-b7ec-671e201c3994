import { jest } from '@jest/globals';
import {
  receiveAndRetryHandyTerminalDataSync,
  ReceiveAndRetryHandyTerminalDataSyncInput,
  ReceiveAndRetryHandyTerminalDataSyncOutput,
} from '../../src/logic/handy-terminal-sync-retry';

// Import actual implementations to patch them
import * as handyTerminalModule from '../../src/logic/handy-terminal-sync-retry';

// Mock the internal functions before importing the main function
jest.mock('../../src/logic/handy-terminal-sync-retry', () => {
  const actual = jest.requireActual('../../src/logic/handy-terminal-sync-retry');
  return {
    ...actual,
    validateInputFormat: jest.fn(),
    getWorkerById: jest.fn(),
    getWorkInstructionById: jest.fn(),
    saveHandyTerminalSyncLog: jest.fn(),
    notifyAdminForManualHandyTerminalRetry: jest.fn(),
  };
});

describe('SCEN-325: ハンディターミナルからのリアルタイムデータ送信', () => {
  describe('作業者が存在しない場合のエラーハンドリング', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('作業者がシステムに存在しない場合、validation_failedステータスでエラーを返す', async () => {
      const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
        workerId: 'worker-001',
        workInstructionId: 'instr-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T09:30:00Z',
        completedQuantity: 50,
        defectiveQuantity: 2,
        remarks: '通常作業',
        handyTerminalId: 'terminal-001',
        transmissionTimestamp: '2024-01-15T09:31:00Z',
        allowableDelayMilliseconds: 5000,
        maxRetryAttempts: 3,
        retryIntervalMilliseconds: 1000,
      };

      // Setup stubs - mock the internal dependencies
      const mockValidateInputFormat = handyTerminalModule.validateInputFormat as jest.MockedFunction<typeof handyTerminalModule.validateInputFormat>;
      const mockGetWorkerById = handyTerminalModule.getWorkerById as jest.MockedFunction<typeof handyTerminalModule.getWorkerById>;
      const mockGetWorkInstructionById = handyTerminalModule.getWorkInstructionById as jest.MockedFunction<typeof handyTerminalModule.getWorkInstructionById>;
      const mockSaveHandyTerminalSyncLog = handyTerminalModule.saveHandyTerminalSyncLog as jest.MockedFunction<typeof handyTerminalModule.saveHandyTerminalSyncLog>;
      const mockNotifyAdminForManualHandyTerminalRetry = handyTerminalModule.notifyAdminForManualHandyTerminalRetry as jest.MockedFunction<typeof handyTerminalModule.notifyAdminForManualHandyTerminalRetry>;

      mockValidateInputFormat.mockReturnValue(true);
      mockGetWorkerById.mockReturnValue(null);

      const result: ReceiveAndRetryHandyTerminalDataSyncOutput =
        await receiveAndRetryHandyTerminalDataSync(input);

      // Verify output
      expect(result.syncStatus).toBe('validation_failed');
      expect(result.workResultId).toBeNull();
      expect(result.errorMessage).toBe(
        '指定された作業者または作業指示が見つかりません。'
      );
      expect(result.adminNotificationSent).toBe(false);
      expect(result.retryAttemptCount).toBe(0);

      // Verify processedDateTime is present and is a valid ISO 8601 string
      expect(result.processedDateTime).toBeDefined();
      expect(typeof result.processedDateTime).toBe('string');
      expect(() => new Date(result.processedDateTime)).not.toThrow();

      // Verify getWorkerById was called with the correct argument
      expect(mockGetWorkerById).toHaveBeenCalledWith('worker-001');

      // Verify getWorkInstructionById was not called (processing stopped at worker check)
      expect(mockGetWorkInstructionById).not.toHaveBeenCalled();

      // Verify saveHandyTerminalSyncLog was not called
      expect(mockSaveHandyTerminalSyncLog).not.toHaveBeenCalled();

      // Verify notifyAdminForManualHandyTerminalRetry was not called
      expect(mockNotifyAdminForManualHandyTerminalRetry).not.toHaveBeenCalled();
    });
  });
});