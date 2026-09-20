import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1577: ハンディターミナルデータ同期リトライ', () => {
  it('ハンディターミナルからのデータ送信が許容値内の遅延で完了し、作業実績データが集約・生産性計算され、連携ログが記録された後、工程完了となる', async () => {
    const testStartTime = Date.now();

    const input = {
      workerId: 'WORKER-001',
      workInstructionId: 'WI-12345',
      facilityId: 'FAC-002',
      teamId: 'TEAM-A',
      workStartDateTime: '2025-01-15T09:00:00Z',
      workEndDateTime: '2025-01-15T10:30:00Z',
      completedQuantity: 150,
      defectiveQuantity: 5,
      remarks: '定型作業',
      handyTerminalId: 'HT-0456',
      transmissionTimestamp: '2025-01-15T10:31:00Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const output = await receiveAndRetryHandyTerminalDataSync(input);

    expect(output).toBeDefined();
    expect(output.syncLogId).toBeDefined();
    expect(typeof output.syncLogId).toBe('string');

    expect(output.syncStatus).toBe('success');

    expect(output.retryAttemptCount).toBe(0);

    expect(output.actualDelayMilliseconds).toBeDefined();
    expect(typeof output.actualDelayMilliseconds).toBe('number');
    expect(output.actualDelayMilliseconds).toBeLessThanOrEqual(5000);
    expect(output.actualDelayMilliseconds).toBeGreaterThanOrEqual(0);

    expect(output.workResultId).toBeDefined();
    expect(output.workResultId).not.toBeNull();
    expect(typeof output.workResultId).toBe('string');

    expect(output.adminNotificationSent).toBe(false);

    expect(output.errorMessage).toBeNull();

    expect(output.processedDateTime).toBeDefined();
    const processedTime = new Date(output.processedDateTime).getTime();
    expect(processedTime).toBeGreaterThanOrEqual(testStartTime);
  });
});