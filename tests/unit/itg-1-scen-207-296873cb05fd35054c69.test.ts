import {
  recordWorkInstructionReceptionAndStatus,
  InvalidExecutionStatusTransitionError,
} from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-207: Error case - Invalid execution status transition', () => {
  it('should throw InvalidExecutionStatusTransitionError when attempting to transition from not_started to in_progress without acknowledged state', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'WR-001',
      allocationExecutionStatusId: 'AESS-001',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-15T10:00:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2024-01-15T10:05:00Z',
      executionEndTimestamp: null,
      progressRate: 25,
      completedQuantity: 10,
      plannedQuantity: 40,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'app_notification' as const,
      operatingUserId: 'USR-001',
      notes: null,
    };

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      InvalidExecutionStatusTransitionError
    );

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      /Invalid execution status transition from not_started to in_progress/
    );
  });
});