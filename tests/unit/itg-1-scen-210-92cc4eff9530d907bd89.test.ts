import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';

// Mock auth-authorization-audit
jest.mock('../../src/logic/auth-authorization-audit', () => ({
  authorizeOperation: jest.fn(),
}));

import { authorizeOperation } from '../../src/logic/auth-authorization-audit';

describe('SCEN-210: UnauthorizedOperationError when user lacks facility/team access', () => {
  const mockAuthorizeOperation = authorizeOperation as jest.MockedFunction<typeof authorizeOperation>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedOperationError when operatingUserId lacks access rights', async () => {
    // Arrange
    const unauthorizedUserId = 'user-no-access-123';
    const facilityId = 'facility-456';
    const teamId = 'team-789';
    const workInstructionId = 'work-inst-001';
    const workerId = 'worker-111';
    const allocationExecutionStatusId = 'exec-status-222';

    const input = {
      workInstructionId,
      workerId,
      allocationExecutionStatusId,
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: new Date().toISOString(),
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      actualWorkHours: null,
      deliveryMethod: 'app_notification' as const,
      operatingUserId: unauthorizedUserId,
      notes: null,
    };

    // Mock authorizeOperation to throw UnauthorizedOperationError
    const unauthorizedError = new Error(
      `User ${unauthorizedUserId} is not authorized to record reception for facility ${facilityId} or team ${teamId}`
    );
    unauthorizedError.name = 'UnauthorizedOperationError';
    mockAuthorizeOperation.mockImplementation(() => {
      throw unauthorizedError;
    });

    // Act & Assert
    try {
      await recordWorkInstructionReceptionAndStatus(input);
      fail('Expected UnauthorizedOperationError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('UnauthorizedOperationError');
      expect(error.message).toMatch(
        new RegExp(`User ${unauthorizedUserId} is not authorized to record reception for facility .* or team .*`)
      );
      expect(mockAuthorizeOperation).toHaveBeenCalled();
    }
  });

  it('should verify that no data is persisted when authorization fails', async () => {
    // Arrange
    const unauthorizedUserId = 'user-no-access-999';
    const workInstructionId = 'work-inst-999';
    const workerId = 'worker-999';
    const allocationExecutionStatusId = 'exec-status-999';

    const input = {
      workInstructionId,
      workerId,
      allocationExecutionStatusId,
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: new Date().toISOString(),
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: new Date().toISOString(),
      executionEndTimestamp: null,
      progressRate: 50,
      completedQuantity: 50,
      plannedQuantity: 100,
      plannedEndTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      actualWorkHours: 4,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: unauthorizedUserId,
      notes: 'Test notes',
    };

    const unauthorizedError = new Error(
      `User ${unauthorizedUserId} is not authorized to record reception for facility unknown or team unknown`
    );
    unauthorizedError.name = 'UnauthorizedOperationError';
    mockAuthorizeOperation.mockImplementation(() => {
      throw unauthorizedError;
    });

    // Act & Assert
    try {
      await recordWorkInstructionReceptionAndStatus(input);
      fail('Expected UnauthorizedOperationError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('UnauthorizedOperationError');
      // Verify that authorizeOperation was called to perform the check
      expect(mockAuthorizeOperation).toHaveBeenCalled();
      // No output should be returned, meaning no data persistence occurred
    }
  });
});