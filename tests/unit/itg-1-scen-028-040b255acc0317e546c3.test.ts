import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import * as authModule from '../../src/logic/auth-authorization-audit';

jest.mock('../../src/logic/auth-authorization-audit');

describe('SCEN-028: Unauthorized User Cannot Auto-Approve and Deliver Staffing Plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedOperationError when user lacks auto-approval and delivery permission', async () => {
    // Arrange: Set up unauthorized user
    const unauthorizedUserId = 'user-999';
    const validInput = {
      facilityId: 'facility-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: unauthorizedUserId,
      autoApprovalEnabled: true,
    };

    // Create UnauthorizedOperationError with proper structure
    const unauthorizedError = new Error('この操作を実行する権限がありません。');
    (unauthorizedError as any).errorCode = 'UnauthorizedOperationError';
    (unauthorizedError as any).name = 'UnauthorizedOperationError';

    // Mock authorizeOperation to always throw UnauthorizedOperationError for this user and operation
    (authModule.authorizeOperation as jest.Mock).mockImplementation(
      (userId: string, operation: string) => {
        if (userId === unauthorizedUserId && operation === 'auto_approval_and_delivery') {
          throw unauthorizedError;
        }
      }
    );

    // Act & Assert: Verify the exception propagates without being caught
    await expect(runTx2Imp2Agent(validInput, {} as any)).rejects.toThrow(unauthorizedError);

    // Verify authorization was called with correct parameters
    expect(authModule.authorizeOperation).toHaveBeenCalledWith(
      unauthorizedUserId,
      'auto_approval_and_delivery'
    );

    // Verify audit logging was not called due to permission check failure
    expect(authModule.recordOperationAudit).not.toHaveBeenCalled();
  });

  it('should verify the error has correct properties when thrown', async () => {
    // Arrange
    const unauthorizedUserId = 'user-999';
    const validInput = {
      facilityId: 'facility-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: unauthorizedUserId,
      autoApprovalEnabled: true,
    };

    const unauthorizedError = new Error('この操作を実行する権限がありません。');
    (unauthorizedError as any).errorCode = 'UnauthorizedOperationError';
    (unauthorizedError as any).name = 'UnauthorizedOperationError';

    (authModule.authorizeOperation as jest.Mock).mockImplementation(
      (userId: string, operation: string) => {
        if (userId === unauthorizedUserId && operation === 'auto_approval_and_delivery') {
          throw unauthorizedError;
        }
      }
    );

    // Act & Assert: Capture and verify error properties
    try {
      await runTx2Imp2Agent(validInput, {} as any);
      fail('Expected UnauthorizedOperationError to be thrown');
    } catch (thrownError: any) {
      // Verify error code
      expect(thrownError.errorCode).toBe('UnauthorizedOperationError');

      // Verify error message
      expect(thrownError.message).toBe('この操作を実行する権限がありません。');

      // Verify error is not a Tx2Imp2AgentOutput structure
      expect(thrownError).not.toHaveProperty('status');
      expect(thrownError).not.toHaveProperty('generatedAllocationPlans');
      expect(thrownError).not.toHaveProperty('autoApprovedPlans');
      expect(thrownError).not.toHaveProperty('pendingApprovalPlans');
      expect(thrownError).not.toHaveProperty('deliveredInstructionCount');
      expect(thrownError).not.toHaveProperty('failedDeliveryCount');
      expect(thrownError).not.toHaveProperty('analysisMetadata');

      // Verify errorDetails is not present
      expect(thrownError).not.toHaveProperty('errorDetails');

      // Verify it's an Error instance
      expect(thrownError instanceof Error).toBe(true);
    }

    // Verify recordOperationAudit was not called
    expect(authModule.recordOperationAudit).not.toHaveBeenCalled();
  });
});