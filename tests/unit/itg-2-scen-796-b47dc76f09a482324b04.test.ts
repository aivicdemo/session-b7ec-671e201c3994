import { registerScheduledJobTrigger } from '../../src/logic/notification-and-integration';

describe('registerScheduledJobTrigger - Invalid Input Error Handling', () => {
  describe('SCEN-796: InvalidJobTriggerInput error when required fields are missing', () => {
    it('should throw InvalidJobTriggerInput error when jobId is null', async () => {
      const input = {
        jobId: null as any,
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when jobId is undefined', async () => {
      const input = {
        jobId: undefined as any,
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when triggerType is null', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: null as any,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when triggerType is undefined', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: undefined as any,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when executionTargetType is null', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: null as any,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when executionTargetType is undefined', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: undefined as any,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when jobName is null', async () => {
      const input = {
        jobId: 'job-456',
        jobName: null as any,
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when jobName is undefined', async () => {
      const input = {
        jobId: 'job-456',
        jobName: undefined as any,
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when requestedBy is null', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: null as any,
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when requestedBy is undefined', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: undefined as any,
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when jobId is empty string', async () => {
      const input = {
        jobId: '',
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when jobName is empty string', async () => {
      const input = {
        jobId: 'job-456',
        jobName: '',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: 'user-123',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });

    it('should throw InvalidJobTriggerInput error when requestedBy is empty string', async () => {
      const input = {
        jobId: 'job-456',
        jobName: 'Test Job',
        triggerType: 'SCHEDULED' as const,
        executionTargetType: 'DAILY_BATCH' as const,
        requestedBy: '',
      };

      await expect(registerScheduledJobTrigger(input)).rejects.toThrow(
        'Invalid scheduled job trigger input: required fields missing or invalid.'
      );
    });
  });
});