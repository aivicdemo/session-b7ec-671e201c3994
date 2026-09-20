import { registerScheduledJobTrigger } from '../../src/logic/notification-and-integration';

describe('SCEN-802: notifyOnFailureがtrueでジョブが失敗した場合、管理者へ失敗通知が送信される', () => {
  it('should send failure notification to administrator when notifyOnFailure is true and job fails', async () => {
    const input = {
      jobId: 'JOB-001',
      jobName: 'Daily Batch Process',
      triggerType: 'SCHEDULED' as const,
      executionTargetType: 'DAILY_BATCH' as const,
      scheduledExecutionTime: '2024-01-15T02:00:00Z',
      executionParameters: {},
      maxRetries: 3,
      retryIntervalSeconds: 60,
      timeoutSeconds: 3600,
      notifyOnCompletion: true,
      notifyOnFailure: true,
      requestedBy: 'ADMIN-001',
      correlationId: 'CORR-12345',
    };

    const mockAiClient = {
      validateInputData: jest.fn().mockResolvedValue(true),
      findUserById: jest.fn().mockResolvedValue({
        userId: 'ADMIN-001',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'ADMIN',
      }),
      executeJobTarget: jest.fn().mockRejectedValue(
        new Error('JobExecutionFailed: Database connection timeout'),
      ),
      sendNotificationToAdministrator: jest.fn().mockResolvedValue({
        success: true,
        trackingId: 'NOTIF-TRACK-001',
        sentAt: new Date().toISOString(),
        deliveryChannel: 'EMAIL',
        errorMessage: null,
      }),
    };

    const result = await registerScheduledJobTrigger(input, mockAiClient as any);

    // Verify input validation was called
    expect(mockAiClient.validateInputData).toHaveBeenCalled();

    // Verify user lookup was called
    expect(mockAiClient.findUserById).toHaveBeenCalledWith('ADMIN-001');

    // Verify job execution was attempted
    expect(mockAiClient.executeJobTarget).toHaveBeenCalled();

    // Verify failure notification was sent
    expect(mockAiClient.sendNotificationToAdministrator).toHaveBeenCalledWith(
      expect.objectContaining({
        administratorId: 'ADMIN-001',
        notificationType: 'JOB_FAILURE_ALERT',
        priorityLevel: 'HIGH',
        relatedEntityId: expect.any(String),
      }),
    );

    // Verify output structure and values
    expect(result.success).toBe(false);
    expect(result.executionStatus).toBe('FAILED');
    expect(result.errorMessage).toBeTruthy();
    expect(result.notificationsSent?.failureNotificationTrackingId).toBeTruthy();
    expect(typeof result.notificationsSent?.failureNotificationTrackingId).toBe('string');
    expect(result.notificationsSent.failureNotificationTrackingId).not.toBe('');
  });
});