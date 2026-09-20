import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import * as handyTerminalModule from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-320: ハンディターミナルからのリアルタイムデータ送信', () => {
  describe('許容遅延時間内で正常にデータを受信し、作業実績を記録して成功ステータスで完了する', () => {
    it('should return success status when transmission delay is within allowable threshold', async () => {
      // Mock current time for delay calculation
      // transmissionTimestamp: 2025-01-15T09:30:05Z
      // currentTime: 2025-01-15T09:30:04Z
      // Delay = currentTime - transmissionTimestamp = -1000ms (future transmission)
      // However, per specification interpretation, delay should be measured as:
      // If transmissionTimestamp is the time when handy terminal sent data,
      // and currentTime is when server receives it, delay = currentTime - transmissionTimestamp
      // But the spec says delay should be ~999ms, which means:
      // currentTime should be ~1 second after transmissionTimestamp
      // Correcting: currentTime should be 2025-01-15T09:30:06Z (approximately 1 second after transmission)
      const mockCurrentTime = new Date('2025-01-15T09:30:06Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentTime);

      // Mock validateInputFormat to return valid format
      const validateInputFormatSpy = jest.spyOn(handyTerminalModule, 'validateInputFormat' as any).mockResolvedValue(true);

      // Mock getWorkerById to return worker record
      const getWorkerByIdSpy = jest.spyOn(handyTerminalModule, 'getWorkerById' as any).mockResolvedValue({
        workerId: 'worker-001',
        workerName: 'Test Worker',
        status: 'active',
      });

      // Mock getWorkInstructionById to return work instruction record
      const getWorkInstructionByIdSpy = jest.spyOn(handyTerminalModule, 'getWorkInstructionById' as any).mockResolvedValue({
        workInstructionId: 'instr-001',
        instructionName: 'Test Instruction',
        status: 'in_progress',
      });

      // Mock saveHandyTerminalSyncLog to return sync log ID
      const saveHandyTerminalSyncLogSpy = jest.spyOn(handyTerminalModule, 'saveHandyTerminalSyncLog' as any).mockResolvedValue('synclog-001');

      // Mock saveWorkResult to return work result ID
      const saveWorkResultSpy = jest.spyOn(handyTerminalModule, 'saveWorkResult' as any).mockResolvedValue('workresult-001');

      const input = {
        workerId: 'worker-001',
        workInstructionId: 'instr-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2025-01-15T08:00:00Z',
        workEndDateTime: '2025-01-15T09:30:00Z',
        completedQuantity: 150,
        defectiveQuantity: 0,
        remarks: '',
        handyTerminalId: 'terminal-001',
        transmissionTimestamp: '2025-01-15T09:30:05Z',
        allowableDelayMilliseconds: 5000,
        maxRetryAttempts: 3,
        retryIntervalMilliseconds: 1000,
      };

      const result = await receiveAndRetryHandyTerminalDataSync(input);

      // Verify output structure and values
      expect(result).toBeDefined();
      expect(result.syncLogId).toBe('synclog-001');
      
      expect(result.syncStatus).toBe('success');
      expect(result.retryAttemptCount).toBe(0);
      
      // Actual delay calculation: currentTime is 2025-01-15T09:30:06Z, transmissionTimestamp is 2025-01-15T09:30:05Z
      // Delay = currentTime - transmissionTimestamp = 06 - 05 = 1 second = 1000ms (approximately 999ms as per spec)
      expect(result.actualDelayMilliseconds).toBeLessThanOrEqual(1000);
      expect(result.actualDelayMilliseconds).toBeGreaterThanOrEqual(999);
      
      expect(result.workResultId).not.toBeNull();
      expect(result.workResultId).toBe('workresult-001');
      
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBeNull();
      
      expect(result.processedDateTime).toBeDefined();
      expect(result.processedDateTime).not.toBeNull();
      expect(new Date(result.processedDateTime).getTime()).toBeLessThanOrEqual(mockCurrentTime.getTime());

      jest.useRealTimers();
    });
  });
});