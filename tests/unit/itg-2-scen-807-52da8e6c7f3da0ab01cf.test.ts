import { registerScheduledJobTrigger } from '../../src/logic/notification-and-integration';
import * as notificationAndIntegration from '../../src/logic/notification-and-integration';

describe('SCEN-807: registerScheduledJobTrigger with executionParameters', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let findUserByIdSpy: jest.SpyInstance;
  let sendNotificationToAdministratorSpy: jest.SpyInstance;
  let executeBusinessProcessSpy: jest.SpyInstance;

  beforeEach(() => {
    validateInputDataSpy = jest.spyOn(notificationAndIntegration, 'validateInputData' as any).mockResolvedValue(true);
    findUserByIdSpy = jest.spyOn(notificationAndIntegration, 'findUserById' as any).mockResolvedValue({
      userId: 'USER-123',
      userName: 'Test User',
      email: 'test@example.com',
      status: 'active',
    });
    sendNotificationToAdministratorSpy = jest.spyOn(notificationAndIntegration, 'sendNotificationToAdministrator' as any).mockResolvedValue({
      success: true,
      trackingId: 'NOTIF-001',
      sentAt: new Date().toISOString(),
      deliveryChannel: 'EMAIL',
      errorMessage: null,
    });
    executeBusinessProcessSpy = jest.spyOn(notificationAndIntegration, 'executeBusinessProcess' as any).mockResolvedValue({
      param1: 'value1',
      param2: 123,
      param3: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should pass executionParameters to the business process and return success with proper output fields', async () => {
    const input = {
      jobId: 'JOB-001',
      jobName: 'Daily Batch Job',
      triggerType: 'SCHEDULED' as const,
      executionTargetType: 'DAILY_BATCH' as const,
      scheduledExecutionTime: '2024-01-15T09:00:00Z',
      executionParameters: {
        param1: 'value1',
        param2: 123,
        param3: true,
      },
      maxRetries: 3,
      retryIntervalSeconds: 60,
      timeoutSeconds: 3600,
      notifyOnCompletion: true,
      notifyOnFailure: true,
      requestedBy: 'USER-123',
    };

    const result = await registerScheduledJobTrigger(input);

    expect(result.success).toBe(true);
    expect(result.jobExecutionId).toBeDefined();
    expect(typeof result.jobExecutionId).toBe('string');
    expect(result.jobId).toBe('JOB-001');
    expect(['REGISTERED', 'QUEUED', 'RUNNING']).toContain(result.executionStatus);
    expect(result.registeredAt).toBeDefined();
    expect(result.registeredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.estimatedExecutionTime).toBe('2024-01-15T09:00:00Z');
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent).toEqual(
      expect.objectContaining({
        completionNotificationTrackingId: expect.any(String),
        failureNotificationTrackingId: expect.any(String),
      })
    );
    expect(result.errorMessage).toBeNull();

    expect(validateInputDataSpy).toHaveBeenCalled();
    expect(findUserByIdSpy).toHaveBeenCalledWith('USER-123');

    expect(executeBusinessProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        executionTargetType: 'DAILY_BATCH',
        executionParameters: {
          param1: 'value1',
          param2: 123,
          param3: true,
        },
      })
    );

    const callArgs = executeBusinessProcessSpy.mock.calls[0][0];
    expect(callArgs.executionParameters).toEqual({
      param1: 'value1',
      param2: 123,
      param3: true,
    });
  });
});