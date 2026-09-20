import { registerScheduledJobTrigger } from '../../src/logic/notification-and-integration';
import { RegisterScheduledJobTriggerInput, RegisterScheduledJobTriggerOutput } from '../../src/logic/notification-and-integration';
import * as notificationModule from '../../src/logic/notification-and-integration';

describe('SCEN-806: registerScheduledJobTrigger with correlationId', () => {
  let validateInputDataStub: jest.SpyInstance;
  let findUserByIdStub: jest.SpyInstance;

  beforeEach(() => {
    validateInputDataStub = jest.spyOn(notificationModule, 'validateInputData' as any).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    findUserByIdStub = jest.spyOn(notificationModule, 'findUserById' as any).mockResolvedValue({
      userId: 'user-001',
      userName: 'Test User',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should include the same correlationId in output when specified in input', async () => {
    // Arrange
    const correlationId = 'correlation-12345';
    const input: RegisterScheduledJobTriggerInput = {
      jobId: 'job-001',
      jobName: 'job-001',
      triggerType: 'SCHEDULED',
      executionTargetType: 'DAILY_BATCH',
      requestedBy: 'user-001',
      correlationId: correlationId,
    };

    // Act
    const result: RegisterScheduledJobTriggerOutput = await registerScheduledJobTrigger(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.correlationId).toBe(correlationId);
    expect(result.jobExecutionId).toBeDefined();
    expect(typeof result.jobExecutionId).toBe('string');
    expect(result.jobExecutionId.length).toBeGreaterThan(0);
    expect(['REGISTERED', 'QUEUED']).toContain(result.executionStatus);
    expect(validateInputDataStub).toHaveBeenCalled();
    expect(findUserByIdStub).toHaveBeenCalledWith('user-001');
  });
});