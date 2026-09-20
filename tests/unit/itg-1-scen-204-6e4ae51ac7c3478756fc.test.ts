import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-204: エラー系：指定された作業者IDが存在しないまたは削除済みの場合、WorkerNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFoundError when worker does not exist', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'WORKER-999',
      allocationExecutionStatusId: 'ALLOC-001',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'app_notification' as const,
      operatingUserId: 'USER-001',
      notes: null,
    };

    // Stub getWorkInstructionById to return a valid work instruction
    const getWorkInstructionByIdSpy = jest.spyOn(workInstructionDeliveryManager as any, 'getWorkInstructionById').mockResolvedValue({
      workInstructionId: 'WI-001',
      workName: 'Test Work',
      workDescription: 'Test Description',
      plannedEndDateTime: '2024-01-15T18:00:00Z',
    });

    // Stub getWorkerById to return null (worker does not exist)
    const getWorkerByIdSpy = jest.spyOn(workInstructionDeliveryManager as any, 'getWorkerById').mockResolvedValue(null);

    // Stub save functions to ensure they are not called
    const saveWorkInstructionReceptionHistorySpy = jest.spyOn(workInstructionDeliveryManager as any, 'saveWorkInstructionReceptionHistory').mockResolvedValue({ receptionHistoryId: 'RH-001' });
    const saveAllocationExecutionStatusSpy = jest.spyOn(workInstructionDeliveryManager as any, 'saveAllocationExecutionStatus').mockResolvedValue({ allocationExecutionStatusId: 'ALLOC-001' });
    const saveProgressDataSpy = jest.spyOn(workInstructionDeliveryManager as any, 'saveProgressData').mockResolvedValue({ progressDataId: 'PD-001' });

    // Execute and verify error is thrown
    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('Worker not found: WORKER-999'),
      })
    );

    // Verify that getWorkInstructionById was called
    expect(getWorkInstructionByIdSpy).toHaveBeenCalledWith('WI-001');

    // Verify that getWorkerById was called
    expect(getWorkerByIdSpy).toHaveBeenCalledWith('WORKER-999');

    // Verify that save functions were NOT called (transaction rollback)
    expect(saveWorkInstructionReceptionHistorySpy).not.toHaveBeenCalled();
    expect(saveAllocationExecutionStatusSpy).not.toHaveBeenCalled();
    expect(saveProgressDataSpy).not.toHaveBeenCalled();

    // Clean up
    getWorkInstructionByIdSpy.mockRestore();
    getWorkerByIdSpy.mockRestore();
    saveWorkInstructionReceptionHistorySpy.mockRestore();
    saveAllocationExecutionStatusSpy.mockRestore();
    saveProgressDataSpy.mockRestore();
  });
});