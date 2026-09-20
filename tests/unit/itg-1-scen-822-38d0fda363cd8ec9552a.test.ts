import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-822: saveAllocationExecutionStatus - Worker not found error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFound error when specified worker ID does not exist', async () => {
    // Setup error object with proper name property
    const workerNotFoundError = new Error('指定された作業者が見つかりません。');
    workerNotFoundError.name = 'WorkerNotFound';

    // Setup mocks for dependent functions
    jest.spyOn(dataPersistence, 'getWorkerById' as any).mockRejectedValue(workerNotFoundError);

    jest.spyOn(dataPersistence, 'getAllocationPlanById' as any).mockResolvedValue({
      allocationPlanId: 'plan-001',
      planName: '配置案001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'instr-001',
      allocationStartDate: '2024-01-10',
      allocationEndDate: '2024-01-10',
      estimatedWorkHours: 8,
      estimatedCompletionDate: '2024-01-10',
      status: '承認済み',
      description: 'テスト配置案',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    });

    jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockResolvedValue({
      workInstructionId: 'instr-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: '説明',
      plannedStartDateTime: '2024-01-10T09:00:00Z',
      plannedEndDateTime: '2024-01-10T17:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: '未開始',
      progressRate: 0,
      requiredWorkerCount: 1,
      priority: '中',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    });

    jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue({
      facilityId: 'facility-001',
      facilityName: '拠点A',
      facilityCode: 'FAC-001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '03-xxxx-xxxx',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    });

    jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
      teamId: 'team-001',
      teamName: 'チームA',
      facilityId: 'facility-001',
      teamLeaderId: 'user-002',
      teamDescription: 'テストチーム',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    });

    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockResolvedValue(true);
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockResolvedValue(true);

    // Mock persistence functions to ensure they are not called
    jest.spyOn(dataPersistence, 'insertAllocationExecutionStatus' as any).mockResolvedValue(undefined);
    jest.spyOn(dataPersistence, 'updateAllocationExecutionStatus' as any).mockResolvedValue(undefined);

    // Arrange: Prepare SaveAllocationExecutionStatusInput with non-existent worker ID
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-nonexistent',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-10T09:00:00Z',
      plannedEndDateTime: '2024-01-10T17:00:00Z',
      actualStartDateTime: '2024-01-10T09:15:00Z',
      actualEndDateTime: null as string | null | undefined,
      plannedWorkHours: 8,
      actualWorkHours: null as number | null | undefined,
      progressRate: 25,
      delayFlag: false,
      remarks: null as string | null | undefined,
      createdBy: 'user-001',
      updatedBy: null as string | null | undefined,
    };

    // Get mock references before calling the function to verify call order
    const mockGetWorkerById = jest.mocked(dataPersistence.getWorkerById);
    const mockGetAllocationPlanById = jest.mocked(dataPersistence.getAllocationPlanById);
    const mockGetWorkInstructionById = jest.mocked(dataPersistence.getWorkInstructionById);
    const mockGetFacilityById = jest.mocked(dataPersistence.getFacilityById);
    const mockGetTeamById = jest.mocked(dataPersistence.getTeamById);
    const mockValidateDateTimeRange = jest.mocked(dataPersistence.validateDateTimeRange);
    const mockValidateNumericQuantity = jest.mocked(dataPersistence.validateNumericQuantity);
    const mockInsertAllocationExecutionStatus = jest.mocked(
      dataPersistence.insertAllocationExecutionStatus
    );
    const mockUpdateAllocationExecutionStatus = jest.mocked(
      dataPersistence.updateAllocationExecutionStatus
    );

    // Act & Assert: Call the function and verify the error is thrown
    let thrownError: Error | undefined;
    try {
      await saveAllocationExecutionStatus(input);
      fail('Expected saveAllocationExecutionStatus to throw an error');
    } catch (error) {
      thrownError = error as Error;
    }

    // Verify error message
    expect(thrownError?.message).toBe('指定された作業者が見つかりません。');

    // Verify error name property
    expect(thrownError?.name).toBe('WorkerNotFound');

    // Verify that getWorkerById was called first with the non-existent worker ID
    expect(mockGetWorkerById).toHaveBeenCalledWith('worker-nonexistent');
    expect(mockGetWorkerById).toHaveBeenCalledTimes(1);

    // Verify call order: getWorkerById should be called before all other functions
    expect(mockGetWorkerById.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetAllocationPlanById.mock.invocationCallOrder[0] || Infinity
    );

    // Verify that other data access functions were not called after the error
    expect(mockGetAllocationPlanById).not.toHaveBeenCalled();
    expect(mockGetWorkInstructionById).not.toHaveBeenCalled();
    expect(mockGetFacilityById).not.toHaveBeenCalled();
    expect(mockGetTeamById).not.toHaveBeenCalled();
    expect(mockValidateDateTimeRange).not.toHaveBeenCalled();
    expect(mockValidateNumericQuantity).not.toHaveBeenCalled();

    // Verify that persistence functions were not called (no data was persisted)
    expect(mockInsertAllocationExecutionStatus).not.toHaveBeenCalled();
    expect(mockUpdateAllocationExecutionStatus).not.toHaveBeenCalled();

    // Cleanup
    jest.restoreAllMocks();
  });
});