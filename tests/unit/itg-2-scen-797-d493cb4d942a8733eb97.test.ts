import { registerScheduledJobTrigger } from '../../src/logic/notification-and-integration';
import * as persistenceLayer from '../../src/persistence-layer';
import * as validationModule from '../../src/validation';
import * as userModule from '../../src/user-service';

jest.mock('../../src/persistence-layer');
jest.mock('../../src/validation');
jest.mock('../../src/user-service');
jest.mock('../../src/notification-service');

describe('registerScheduledJobTrigger - JobAlreadyRunning Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw JobAlreadyRunning error when job with same ID is already executing', async () => {
    const input = {
      jobId: 'JOB-001',
      jobName: '日次バッチ処理',
      triggerType: 'SCHEDULED' as const,
      executionTargetType: 'DAILY_BATCH' as const,
      scheduledExecutionTime: '2024-12-20T02:00:00Z',
      requestedBy: 'USER-123',
    };

    // Setup prerequisite: same jobId already running in persistence layer
    (persistenceLayer.findRunningJobExecution as jest.Mock).mockResolvedValue({
      jobExecutionId: 'EXEC-001',
      jobId: 'JOB-001',
      executionStatus: 'RUNNING',
    });

    // Setup validateInputData stub to return valid
    (validationModule.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    // Setup findUserById stub to return existing user
    (userModule.findUserById as jest.Mock).mockResolvedValue({
      userId: 'USER-123',
      userName: 'TestUser',
    });

    // Stub for notification service (should not be called)
    const notificationSpy = jest.spyOn(
      require('../../src/notification-service'),
      'sendNotificationToAdministrator'
    );

    await expect(registerScheduledJobTrigger(input)).rejects.toMatchObject({
      name: 'JobAlreadyRunning',
      message: 'Scheduled job is already running: duplicate execution prevented.',
    });

    // Verify RegisterScheduledJobTriggerOutput is not returned
    // (verified by the rejection above)

    // Verify sendNotificationToAdministrator is not called
    expect(notificationSpy).not.toHaveBeenCalled();

    // Verify persistence layer state update is not executed
    expect(persistenceLayer.registerJobExecution).not.toHaveBeenCalled();
    expect(persistenceLayer.updateJobExecutionStatus).not.toHaveBeenCalled();
  });
});