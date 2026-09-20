import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-190: TargetWorkerNotAvailable error when worker is unavailable', () => {
  it('should throw TargetWorkerNotAvailableError when allocation plan contains unavailable worker', async () => {
    const allocationPlanId = 'plan-001';
    const operatingUserId = 'user-mgr-001';
    const availableWorkerId = 'worker-001';
    const unavailableWorkerId = 'worker-unavailable-001';

    const mockAuthorizeOperation = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: operatingUserId,
    });

    const mockGetAllocationPlanById = jest.fn().mockResolvedValue({
      allocationPlanId,
      allocationPlanName: 'Test Plan',
      status: 'approved',
      facilityId: 'facility-001',
      teamId: 'team-001',
      fieldLeaderId: 'leader-001',
      targetWorkers: [
        { workerId: availableWorkerId, workerName: 'Worker One' },
        { workerId: unavailableWorkerId, workerName: 'Unavailable Worker' },
      ],
      workInstructionIds: ['instr-001', 'instr-002'],
    });

    const mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'instr-001',
      workName: 'Test Work',
      plannedEndDateTime: '2024-12-31T23:59:59Z',
    });

    // listWorkersByCondition returns only available worker, omitting unavailableWorkerId
    // This simulates the condition where unavailableWorkerId does not exist or is not in active status
    const mockListWorkersByCondition = jest.fn().mockResolvedValue([
      {
        workerId: availableWorkerId,
        workerName: 'Worker One',
        稼働状況: 'active',
      },
    ]);

    const mockSaveAllocationExecutionStatus = jest.fn();
    const mockSaveWorkInstructionReceptionHistory = jest.fn();

    const mockDependencies = {
      authorizeOperation: mockAuthorizeOperation,
      getAllocationPlanById: mockGetAllocationPlanById,
      getWorkInstructionById: mockGetWorkInstructionById,
      listWorkersByCondition: mockListWorkersByCondition,
      saveAllocationExecutionStatus: mockSaveAllocationExecutionStatus,
      saveWorkInstructionReceptionHistory: mockSaveWorkInstructionReceptionHistory,
    };

    let caughtError: any;
    try {
      await deliverAllocationPlanAndWorkInstructions(
        {
          allocationPlanId,
          operatingUserId,
          deliveryNotes: null,
        },
        mockDependencies as any
      );
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('TargetWorkerNotAvailableError');
    expect(caughtError.message).toMatch(/対象作業者が利用できません/);
    expect(caughtError.message).toContain(unavailableWorkerId);

    expect(mockSaveAllocationExecutionStatus).not.toHaveBeenCalled();
    expect(mockSaveWorkInstructionReceptionHistory).not.toHaveBeenCalled();
  });
});