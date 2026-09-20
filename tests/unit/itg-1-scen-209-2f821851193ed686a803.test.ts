import {
  recordWorkInstructionReceptionAndStatus,
} from '../../src/logic/work-instruction-delivery-manager';

// Mock dependencies
jest.mock('../../src/services/data-persistence', () => ({
  getWorkInstructionById: jest.fn(),
  getWorkerById: jest.fn(),
  getAllocationExecutionStatusById: jest.fn(),
  saveWorkInstructionReceptionHistory: jest.fn(),
  saveAllocationExecutionStatus: jest.fn(),
  saveProgressData: jest.fn(),
}));

jest.mock('../../src/services/validation-common-calculation', () => ({
  validateDateTimeRange: jest.fn(),
  validateNumericQuantity: jest.fn(),
  calculateDelayDays: jest.fn(),
}));

jest.mock('../../src/services/auth-authorization-audit', () => ({
  authorizeOperation: jest.fn(),
  recordOperationAudit: jest.fn(),
}));

jest.mock('../../src/services/notification-external-integration', () => ({
  recordWorkInstructionDeliveryHistory: jest.fn(),
}));

import * as dataPersistence from '../../src/services/data-persistence';
import * as validation from '../../src/services/validation-common-calculation';
import * as auth from '../../src/services/auth-authorization-audit';
import * as notification from '../../src/services/notification-external-integration';

describe('recordWorkInstructionReceptionAndStatus - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-209: DataPersistenceError is thrown when saveWorkInstructionReceptionHistory fails', async () => {
    // Setup mocks for authorization
    (auth.authorizeOperation as jest.Mock).mockResolvedValue(true);

    // Setup mocks for validation
    (validation.validateDateTimeRange as jest.Mock).mockResolvedValue(true);
    (validation.validateNumericQuantity as jest.Mock).mockResolvedValue(true);

    // Setup mocks for data retrieval
    (dataPersistence.getWorkInstructionById as jest.Mock).mockResolvedValue({
      workInstructionId: 'WI-001',
      workName: 'Test Work',
      plannedEndTimestamp: '2024-01-15T17:00:00Z',
    });

    (dataPersistence.getWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'W-123',
      workerName: 'Test Worker',
    });

    (dataPersistence.getAllocationExecutionStatusById as jest.Mock).mockResolvedValue({
      allocationExecutionStatusId: 'AES-456',
      allocationPlanId: 'AP-001',
    });

    // Setup mock to throw DataPersistenceError on saveWorkInstructionReceptionHistory
    const persistenceError = new Error('Database connection timeout');
    persistenceError.name = 'DataPersistenceError';
    (dataPersistence.saveWorkInstructionReceptionHistory as jest.Mock).mockRejectedValue(
      persistenceError
    );

    // Setup mock for notification - should not be called due to error
    (notification.recordWorkInstructionDeliveryHistory as jest.Mock).mockResolvedValue({
      deliveryHistoryId: 'DH-001',
    });

    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-123',
      allocationExecutionStatusId: 'AES-456',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2024-01-15T10:00:00Z',
      executionEndTimestamp: null,
      progressRate: 50,
      completedQuantity: 100,
      plannedQuantity: 200,
      plannedEndTimestamp: '2024-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'app_notification' as const,
      operatingUserId: 'OP-789',
      notes: '作業開始',
    };

    // Execute and verify DataPersistenceError is thrown with correct message format
    let caughtError: any = null;
    let returnValue: any = undefined;

    try {
      returnValue = await recordWorkInstructionReceptionAndStatus(input);
      fail('Expected DataPersistenceError to be thrown');
    } catch (error: any) {
      caughtError = error;
    }

    // Verify error properties
    expect(caughtError).not.toBeNull();
    expect(caughtError.name).toBe('DataPersistenceError');
    expect(caughtError.message).toMatch(/Database connection timeout/);

    // Verify no return value was provided (exception thrown)
    expect(returnValue).toBeUndefined();

    // Verify notification mock was not called due to persistence error
    expect(notification.recordWorkInstructionDeliveryHistory as jest.Mock).not.toHaveBeenCalled();
  });
});