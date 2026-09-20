import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';

// Mock modules
jest.mock('../../src/data/repositories/allocation-plan-repository', () => ({
  getAllocationPlanById: jest.fn(),
}));

jest.mock('../../src/data/repositories/work-instruction-repository', () => ({
  getWorkInstructionById: jest.fn(),
}));

jest.mock('../../src/data/repositories/allocation-execution-status-repository', () => ({
  saveAllocationExecutionStatus: jest.fn(),
}));

jest.mock('../../src/data/repositories/work-instruction-reception-history-repository', () => ({
  saveWorkInstructionReceptionHistory: jest.fn(),
}));

jest.mock('../../src/external-services/notification-service-adapter', () => ({
  NotificationServiceAdapter: {
    sendWorkInstruction: jest.fn(),
  },
}));

import { getAllocationPlanById } from '../../src/data/repositories/allocation-plan-repository';
import { getWorkInstructionById } from '../../src/data/repositories/work-instruction-repository';
import { saveAllocationExecutionStatus } from '../../src/data/repositories/allocation-execution-status-repository';
import { saveWorkInstructionReceptionHistory } from '../../src/data/repositories/work-instruction-reception-history-repository';
import { NotificationServiceAdapter } from '../../src/external-services/notification-service-adapter';

describe('SCEN-187: 配置案に紐づく作業指示が存在しないか削除されている場合、WorkInstructionNotFoundエラーで拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkInstructionNotFound error when work instruction does not exist', async () => {
    // Arrange
    const allocationPlanId = 'allocation-plan-001';
    const operatingUserId = 'user-001';
    const deliveryNotes = null;
    const workInstructionId1 = 'work-instruction-001';
    const workInstructionId2 = 'work-instruction-002';

    // Mock allocation plan lookup to return a valid approved plan with work instruction IDs
    (getAllocationPlanById as jest.Mock).mockResolvedValueOnce({
      allocationPlanId,
      status: 'approved',
      workInstructionIds: [workInstructionId1, workInstructionId2],
      facilityId: 'facility-001',
      teamId: 'team-001',
      configurationId: 'config-001',
    });

    // Mock work instruction lookup: first instruction exists, second does not
    (getWorkInstructionById as jest.Mock)
      .mockResolvedValueOnce({
        workInstructionId: workInstructionId1,
        workName: 'Task 1',
        plannedEndDateTime: '2024-12-31T23:59:59Z',
      })
      .mockResolvedValueOnce(null); // Second work instruction does not exist

    // Act & Assert
    try {
      await deliverAllocationPlanAndWorkInstructions({
        allocationPlanId,
        operatingUserId,
        deliveryNotes,
      });
      fail('Expected WorkInstructionNotFoundError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('WorkInstructionNotFoundError');
      expect(error.message).toContain('作業指示が見つかりません');
      expect(error.message).toContain('作業指示ID:');
      expect(error.message).toContain(workInstructionId2);
    }

    // Verify that allocation plan was retrieved
    expect(getAllocationPlanById).toHaveBeenCalledWith(allocationPlanId);

    // Verify that work instructions were checked
    expect(getWorkInstructionById).toHaveBeenCalledWith(workInstructionId1);
    expect(getWorkInstructionById).toHaveBeenCalledWith(workInstructionId2);

    // Verify that delivery status recording was NOT called
    expect(saveAllocationExecutionStatus).not.toHaveBeenCalled();
    expect(saveWorkInstructionReceptionHistory).not.toHaveBeenCalled();

    // Verify that notification service was NOT called
    expect(NotificationServiceAdapter.sendWorkInstruction).not.toHaveBeenCalled();
  });
});