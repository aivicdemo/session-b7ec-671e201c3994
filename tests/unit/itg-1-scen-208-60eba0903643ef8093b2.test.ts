import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-208: ProgressDataValidationError for invalid progress data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProgressDataValidationError when progressRate is 101 (out of 0-100 range)', async () => {
    const input = {
      workInstructionId: 'work-instr-001',
      workerId: 'worker-001',
      allocationExecutionStatusId: 'alloc-exec-001',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-10T10:00:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 101,
      completedQuantity: 50,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-10T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'email' as const,
      operatingUserId: 'user-001',
      notes: null,
    };

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringMatching(/progressRate must be between 0 and 100|Invalid progress data/i),
      })
    );
  });

  it('should throw ProgressDataValidationError when completedQuantity is negative (-5)', async () => {
    const input = {
      workInstructionId: 'work-instr-002',
      workerId: 'worker-002',
      allocationExecutionStatusId: 'alloc-exec-002',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-10T10:00:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 50,
      completedQuantity: -5,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-10T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'email' as const,
      operatingUserId: 'user-002',
      notes: null,
    };

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringMatching(/completedQuantity must not be negative|Invalid progress data/i),
      })
    );
  });

  it('should throw ProgressDataValidationError when executionEndTimestamp is before executionStartTimestamp', async () => {
    const input = {
      workInstructionId: 'work-instr-003',
      workerId: 'worker-003',
      allocationExecutionStatusId: 'alloc-exec-003',
      receptionStatus: 'in_progress' as const,
      receptionConfirmationTimestamp: '2024-01-10T10:00:00Z',
      executionStatus: 'completed' as const,
      executionStartTimestamp: '2024-01-10T10:00:00Z',
      executionEndTimestamp: '2024-01-10T09:00:00Z',
      progressRate: 50,
      completedQuantity: 10,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-10T18:00:00Z',
      actualWorkHours: 1,
      deliveryMethod: 'email' as const,
      operatingUserId: 'user-003',
      notes: null,
    };

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringMatching(/executionEndTimestamp cannot be before executionStartTimestamp|Invalid progress data/i),
      })
    );
  });

  it('should throw ProgressDataValidationError when progressRate is -1 (out of 0-100 range)', async () => {
    const input = {
      workInstructionId: 'work-instr-004',
      workerId: 'worker-004',
      allocationExecutionStatusId: 'alloc-exec-004',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-10T10:00:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: -1,
      completedQuantity: 50,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-10T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'email' as const,
      operatingUserId: 'user-004',
      notes: null,
    };

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringMatching(/progressRate must be between 0 and 100|Invalid progress data/i),
      })
    );
  });
});