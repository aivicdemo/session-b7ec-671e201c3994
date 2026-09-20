import { registerScheduledJobTrigger, RegisterScheduledJobTriggerInput, RegisterScheduledJobTriggerOutput } from '../../src/logic/notification-and-integration';

describe('registerScheduledJobTrigger', () => {
  describe('SCEN-795: 代表的な正常入力でジョブが登録され、実行状態がREGISTEREDで返される', () => {
    it('should register a scheduled job with valid input and return REGISTERED status', async () => {
      // Arrange
      const input: RegisterScheduledJobTriggerInput = {
        jobId: 'JOB-20240115-001',
        jobName: 'Daily Batch Processing',
        triggerType: 'SCHEDULED',
        executionTargetType: 'DAILY_BATCH',
        scheduledExecutionTime: '2024-01-15T02:00:00Z',
        executionParameters: {},
        maxRetries: 3,
        retryIntervalSeconds: 60,
        timeoutSeconds: 3600,
        notifyOnCompletion: true,
        notifyOnFailure: true,
        requestedBy: 'USER-001'
      };

      // Act
      const result = await registerScheduledJobTrigger(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.executionStatus).toBe('REGISTERED');
      expect(result.jobId).toBe('JOB-20240115-001');
      expect(result.jobExecutionId).toBeDefined();
      expect(typeof result.jobExecutionId).toBe('string');
      expect(result.jobExecutionId.length).toBeGreaterThan(0);
      expect(result.registeredAt).toBeDefined();
      expect(typeof result.registeredAt).toBe('string');
      const registeredDate = new Date(result.registeredAt);
      expect(registeredDate).toBeInstanceOf(Date);
      expect(registeredDate.getTime()).toBeLessThanOrEqual(Date.now());
      expect(registeredDate.getTime()).toBeGreaterThan(Date.now() - 10000);
      expect(result.estimatedExecutionTime).toBe('2024-01-15T02:00:00Z');
      expect(result.retryCount).toBe(0);
      expect(result.errorMessage).toBeNull();
      expect(result.correlationId).toBeNull();
    });
  });
});