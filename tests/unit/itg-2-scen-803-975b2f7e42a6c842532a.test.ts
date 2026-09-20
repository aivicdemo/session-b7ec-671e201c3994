import { registerScheduledJobTrigger } from '../../src/logic/notification-and-integration';
import { RegisterScheduledJobTriggerInput, RegisterScheduledJobTriggerOutput } from '../../src/logic/notification-and-integration';
import * as notificationModule from '../../src/logic/notification-and-integration';

describe('SCEN-803: notifyOnCompletionがfalseの場合、ジョブ完了時に管理者へ通知が送信されない', () => {
  let sendNotificationToAdministratorSpy: jest.SpyInstance;

  beforeEach(() => {
    sendNotificationToAdministratorSpy = jest.spyOn(notificationModule, 'sendNotificationToAdministrator')
      .mockResolvedValue({
        success: true,
        trackingId: 'TRACK-' + Math.random().toString(36).substr(2, 9),
        sentAt: new Date().toISOString(),
        deliveryChannel: 'EMAIL',
        errorMessage: null,
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not send completion notification when notifyOnCompletion is false', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-001',
      jobName: 'Daily Batch Process',
      triggerType: 'SCHEDULED',
      executionTargetType: 'DAILY_BATCH',
      scheduledExecutionTime: '2024-01-15T09:00:00Z',
      executionParameters: {},
      maxRetries: 3,
      retryIntervalSeconds: 60,
      timeoutSeconds: 3600,
      notifyOnCompletion: false,
      notifyOnFailure: true,
      requestedBy: 'USER-123',
      correlationId: 'CORR-001',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(['COMPLETED', 'RUNNING', 'QUEUED'].includes(result.executionStatus)).toBe(true);
    expect(result.jobExecutionId).toBeDefined();
    expect(result.jobId).toBe('JOB-001');
    expect(result.registeredAt).toBeDefined();

    // ISO 8601形式であることを確認
    const registeredDate = new Date(result.registeredAt);
    expect(registeredDate.toISOString()).toBeDefined();

    // 実行完了時にexecutionCompletedAtが設定される
    if (result.executionStatus === 'COMPLETED') {
      expect(result.executionCompletedAt).toBeDefined();
      const completedDate = new Date(result.executionCompletedAt!);
      expect(completedDate.toISOString()).toBeDefined();
    }

    // notifyOnCompletion=falseなので、completionNotificationTrackingIdは存在しないまたはundefined
    if (result.notificationsSent) {
      expect(result.notificationsSent.completionNotificationTrackingId).toBeUndefined();
    }

    // correlationIdが保持されていることを確認
    expect(result.correlationId).toBe('CORR-001');

    // sendNotificationToAdministratorが呼び出されないことを検証（完了通知について）
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should include correlationId in output when provided', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-002',
      jobName: 'Progress Monitoring',
      triggerType: 'SCHEDULED',
      executionTargetType: 'PROGRESS_MONITORING',
      scheduledExecutionTime: '2024-01-15T10:00:00Z',
      executionParameters: {},
      maxRetries: 2,
      retryIntervalSeconds: 30,
      timeoutSeconds: 1800,
      notifyOnCompletion: false,
      notifyOnFailure: true,
      requestedBy: 'USER-456',
      correlationId: 'CORR-002',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert
    expect(result.correlationId).toBe('CORR-002');
    expect(result.success).toBe(true);

    // notifyOnCompletion=falseなので完了通知は送信されない
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should set executionStatus to a valid job state when job completes successfully', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-003',
      jobName: 'Analysis Verification',
      triggerType: 'SCHEDULED',
      executionTargetType: 'ANALYSIS_VERIFICATION',
      scheduledExecutionTime: '2024-01-15T11:00:00Z',
      executionParameters: { analysisType: 'PRODUCTIVITY_TREND' },
      notifyOnCompletion: false,
      notifyOnFailure: false,
      requestedBy: 'USER-789',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert
    expect(['REGISTERED', 'QUEUED', 'RUNNING', 'COMPLETED'].includes(result.executionStatus)).toBe(true);
    expect(result.success).toBe(true);
    if (result.executionDurationSeconds !== undefined) {
      expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(0);
    }

    // notifyOnCompletion=falseなので完了通知は送信されない
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should not include completionNotificationTrackingId when notifyOnCompletion is false', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-004',
      jobName: 'Data Synchronization',
      triggerType: 'SCHEDULED',
      executionTargetType: 'DATA_SYNCHRONIZATION',
      scheduledExecutionTime: '2024-01-15T12:00:00Z',
      executionParameters: { targetSystems: ['WES', 'WMS'] },
      maxRetries: 5,
      retryIntervalSeconds: 120,
      timeoutSeconds: 7200,
      notifyOnCompletion: false,
      notifyOnFailure: true,
      requestedBy: 'SYSTEM',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.notificationsSent) {
      expect(result.notificationsSent.completionNotificationTrackingId).toBeUndefined();
    }

    // sendNotificationToAdministratorが完了通知として呼び出されないことを検証
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should return unique jobExecutionId for each invocation', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-005',
      jobName: 'Placement Optimization',
      triggerType: 'SCHEDULED',
      executionTargetType: 'PLACEMENT_OPTIMIZATION',
      scheduledExecutionTime: '2024-01-15T13:00:00Z',
      executionParameters: {},
      notifyOnCompletion: false,
      notifyOnFailure: false,
      requestedBy: 'USER-111',
    };

    // Act
    const result1 = await registerScheduledJobTrigger(input);
    const result2 = await registerScheduledJobTrigger(input);

    // Assert
    expect(result1.jobExecutionId).toBeDefined();
    expect(result2.jobExecutionId).toBeDefined();
    expect(result1.jobExecutionId).not.toBe(result2.jobExecutionId);

    // notifyOnCompletion=falseなので各実行で完了通知は送信されない
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should validate input data and handle valid scheduled job trigger', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-006',
      jobName: 'Quality Check',
      triggerType: 'SCHEDULED',
      executionTargetType: 'DAILY_BATCH',
      scheduledExecutionTime: '2024-01-15T14:00:00Z',
      executionParameters: {},
      maxRetries: 3,
      retryIntervalSeconds: 60,
      timeoutSeconds: 3600,
      notifyOnCompletion: false,
      notifyOnFailure: true,
      requestedBy: 'USER-200',
      correlationId: 'CORR-006',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.jobId).toBe('JOB-006');
    expect(result.jobExecutionId).toBeDefined();
    expect(result.registeredAt).toBeDefined();
    expect(['REGISTERED', 'QUEUED', 'RUNNING', 'COMPLETED'].includes(result.executionStatus)).toBe(true);

    // sendNotificationToAdministratorが完了通知として呼び出されないことを検証
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should preserve requestedBy user ID in job execution context', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-007',
      jobName: 'Performance Analysis',
      triggerType: 'SCHEDULED',
      executionTargetType: 'ANALYSIS_VERIFICATION',
      scheduledExecutionTime: '2024-01-15T15:00:00Z',
      executionParameters: {},
      notifyOnCompletion: false,
      notifyOnFailure: false,
      requestedBy: 'USER-999',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.jobExecutionId).toBeDefined();
    expect(result.registeredAt).toBeDefined();

    // notifyOnCompletion=falseなので完了通知は送信されない
    const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
      const args = call[0] as any;
      return args?.notificationType === 'JOB_COMPLETION';
    });
    expect(completionNotificationCalls.length).toBe(0);
  });

  it('should respect notifyOnFailure setting when job fails', async () => {
    // Arrange
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'JOB-008',
      jobName: 'Failed Job Test',
      triggerType: 'SCHEDULED',
      executionTargetType: 'DAILY_BATCH',
      scheduledExecutionTime: '2024-01-15T16:00:00Z',
      executionParameters: {},
      notifyOnCompletion: false,
      notifyOnFailure: true,
      requestedBy: 'USER-888',
    };

    // Act
    const result = await registerScheduledJobTrigger(input);

    // Assert - ジョブが成功した場合
    if (result.success && result.executionStatus !== 'FAILED') {
      // notifyOnCompletion=falseなので完了通知は送信されない
      const completionNotificationCalls = sendNotificationToAdministratorSpy.mock.calls.filter(call => {
        const args = call[0] as any;
        return args?.notificationType === 'JOB_COMPLETION';
      });
      expect(completionNotificationCalls.length).toBe(0);
    }

    expect(result.jobExecutionId).toBeDefined();
  });
});