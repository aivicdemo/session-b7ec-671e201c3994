import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1579: ハンディターミナルデータ同期リトライ - 再試行上限到達時の管理者通知', () => {
  it('should notify admin when retry attempts exceed maximum and delay exceeds allowable threshold', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'standard_work',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Verify core response structure
    expect(result).toEqual(
      expect.objectContaining({
        syncStatus: 'retry_limit_exceeded',
        retryAttemptCount: 3,
        actualDelayMilliseconds: expect.any(Number),
        workResultId: null,
        adminNotificationSent: true,
        errorMessage: null,
      })
    );

    // Verify syncLogId is a non-null string
    expect(result.syncLogId).toBeTruthy();
    expect(result.syncLogId).not.toBeNull();
    expect(typeof result.syncLogId).toBe('string');

    // Verify processedDateTime is in ISO 8601 format
    expect(result.processedDateTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    // Verify actualDelayMilliseconds exceeds allowable threshold
    expect(result.actualDelayMilliseconds).toBeGreaterThan(
      input.allowableDelayMilliseconds
    );

    // Verify admin notification was sent
    expect(result.adminNotificationSent).toBe(true);

    // Verify that retry attempt count reached maximum
    expect(result.retryAttemptCount).toBe(input.maxRetryAttempts);
  });

  it('should persist sync log record with all required fields', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'standard_work',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Verify returned syncLogId is not null (indicating persistence)
    expect(result.syncLogId).not.toBeNull();
    expect(result.syncLogId).toBeTruthy();

    // Verify the response includes expected sync status information
    expect(result.syncStatus).toBe('retry_limit_exceeded');
    expect(result.retryAttemptCount).toBe(3);
  });

  it('should execute retry logic and reach maximum retry attempts', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'standard_work',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Verify retry attempt count reached maximum
    expect(result.retryAttemptCount).toBe(3);

    // Verify status indicates retry limit was exceeded
    expect(result.syncStatus).toBe('retry_limit_exceeded');

    // Verify no work result was created (retry failed)
    expect(result.workResultId).toBeNull();

    // Verify that maximum retry attempts were exhausted
    expect(result.retryAttemptCount).toBe(input.maxRetryAttempts);
  });

  it('should include all required response fields', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'standard_work',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Verify all required response fields are present
    expect(result).toHaveProperty('syncLogId');
    expect(result).toHaveProperty('syncStatus');
    expect(result).toHaveProperty('retryAttemptCount');
    expect(result).toHaveProperty('actualDelayMilliseconds');
    expect(result).toHaveProperty('workResultId');
    expect(result).toHaveProperty('adminNotificationSent');
    expect(result).toHaveProperty('errorMessage');
    expect(result).toHaveProperty('processedDateTime');

    // Verify field types
    expect(typeof result.syncLogId).toBe('string');
    expect(typeof result.syncStatus).toBe('string');
    expect(typeof result.retryAttemptCount).toBe('number');
    expect(typeof result.actualDelayMilliseconds).toBe('number');
    expect(result.workResultId).toBeNull();
    expect(typeof result.adminNotificationSent).toBe('boolean');
    expect(result.errorMessage).toBeNull();
    expect(typeof result.processedDateTime).toBe('string');
  });

  it('should complete successfully without errors and with admin notification sent', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'standard_work',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Verify no errors occurred (errorMessage should be null)
    expect(result.errorMessage).toBeNull();

    // Verify that admin notification was sent successfully
    expect(result.adminNotificationSent).toBe(true);

    // Verify the combination: admin notification sent AND error message is null indicates successful completion
    expect(result.adminNotificationSent).toBe(true);
    expect(result.errorMessage).toBeNull();
  });

  it('should record sync log with retry limit exceeded status', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'standard_work',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Verify the logged data reflects the sync operation state
    expect(result.syncStatus).toBe('retry_limit_exceeded');
    expect(result.retryAttemptCount).toBe(3);

    // Verify log persistence by checking syncLogId is not null
    expect(result.syncLogId).not.toBeNull();
    expect(typeof result.syncLogId).toBe('string');
  });
});