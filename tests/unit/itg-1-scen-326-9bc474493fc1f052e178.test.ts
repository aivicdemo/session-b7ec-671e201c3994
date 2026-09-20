import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import * as handyTerminalSyncModule from '../../src/logic/handy-terminal-sync-retry';

jest.mock('../../src/logic/dependencies', () => ({
  validateInputFormat: jest.fn().mockReturnValue(true),
  getWorkerById: jest.fn().mockResolvedValue({
    workerId: 'worker-001',
    name: 'Test Worker',
  }),
  getWorkInstructionById: jest.fn().mockResolvedValue({
    workInstructionId: 'instruction-001',
    name: 'Test Instruction',
  }),
  saveHandyTerminalSyncLog: jest.fn().mockResolvedValue('sync-log-001'),
  notifyAdminForManualHandyTerminalRetry: jest
    .fn()
    .mockRejectedValue(new Error('Notification delivery failed')),
}));

describe('SCEN-326: 再試行上限到達時に管理者への通知送信に失敗した場合、エラーを記録して対応を促す', () => {
  let mockValidateInputFormat: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockSaveHandyTerminalSyncLog: jest.Mock;
  let mockNotifyAdminForManualHandyTerminalRetry: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const deps = require('../../src/logic/dependencies');
    mockValidateInputFormat = deps.validateInputFormat;
    mockGetWorkerById = deps.getWorkerById;
    mockGetWorkInstructionById = deps.getWorkInstructionById;
    mockSaveHandyTerminalSyncLog = deps.saveHandyTerminalSyncLog;
    mockNotifyAdminForManualHandyTerminalRetry =
      deps.notifyAdminForManualHandyTerminalRetry;

    mockValidateInputFormat.mockReturnValue(true);
    mockGetWorkerById.mockResolvedValue({
      workerId: 'worker-001',
      name: 'Test Worker',
    });
    mockGetWorkInstructionById.mockResolvedValue({
      workInstructionId: 'instruction-001',
      name: 'Test Instruction',
    });
    mockSaveHandyTerminalSyncLog.mockResolvedValue('sync-log-001');
    mockNotifyAdminForManualHandyTerminalRetry.mockRejectedValue(
      new Error('Notification delivery failed')
    );
  });

  it('should record error when admin notification fails after retry limit exceeded', async () => {
    const now = new Date();
    const transmissionTimestamp = new Date(
      now.getTime() - 10000
    ).toISOString();

    const input = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T17:00:00Z',
      completedQuantity: 100,
      defectiveQuantity: 5,
      remarks: 'Test work completion',
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: transmissionTimestamp,
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    let exceptionWasCaught = false;
    let result: any = null;

    try {
      result = await receiveAndRetryHandyTerminalDataSync(input);
      exceptionWasCaught = false;
    } catch (error) {
      exceptionWasCaught = true;
      throw error;
    }

    expect(exceptionWasCaught).toBe(false);
    expect(result).toBeDefined();

    expect(result.syncStatus).toBe('retry_limit_exceeded');
    expect(result.adminNotificationSent).toBe(false);
    expect(result.errorMessage).toMatch(
      /AdminNotificationDeliveryFailed.*管理者への通知送信に失敗しました.*手動確認が必要です/
    );
    expect(result.syncLogId).toBe('sync-log-001');
    expect(result.workResultId).toBeNull();
    expect(result.retryAttemptCount).toBe(3);
    expect(result.actualDelayMilliseconds).toBe(10000);

    const processedDateTime = new Date(result.processedDateTime);
    expect(processedDateTime).toBeInstanceOf(Date);
    expect(processedDateTime.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    expect(mockSaveHandyTerminalSyncLog).toHaveBeenCalled();
    expect(mockNotifyAdminForManualHandyTerminalRetry).toHaveBeenCalled();
    expect(mockNotifyAdminForManualHandyTerminalRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        syncLogId: 'sync-log-001',
        retryAttemptCount: 3,
      })
    );
  });
});