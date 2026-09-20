import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-824: saveAllocationExecutionStatus - TeamNotFound error', () => {
  let getTeamByIdSpy: jest.SpyInstance;
  let getAllocationPlanByIdSpy: jest.SpyInstance;
  let getWorkInstructionByIdSpy: jest.SpyInstance;
  let getWorkerByIdSpy: jest.SpyInstance;
  let getFacilityByIdSpy: jest.SpyInstance;
  let validateDateTimeRangeSpy: jest.SpyInstance;
  let validateNumericQuantitySpy: jest.SpyInstance;
  let validateReferentialIntegritySpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup getTeamById stub: return null for nonexistent-team-999
    getTeamByIdSpy = jest
      .spyOn(dataPersistence, 'getTeamById' as any)
      .mockResolvedValue(null);

    // Setup getAllocationPlanById stub: return valid allocation plan object
    getAllocationPlanByIdSpy = jest
      .spyOn(dataPersistence, 'getAllocationPlanById' as any)
      .mockResolvedValue({
        allocationPlanId: 'plan-001',
        planName: 'Test Plan',
        facilityId: 'facility-001',
        teamId: 'nonexistent-team-999',
        workInstructionId: 'instr-001',
        allocationStartDate: '2025-01-20',
        allocationEndDate: '2025-01-25',
        estimatedWorkHours: 40,
        estimatedCompletionDate: '2025-01-25',
        status: '承認済み',
        description: null,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      });

    // Setup getWorkInstructionById stub: return valid work instruction object
    getWorkInstructionByIdSpy = jest
      .spyOn(dataPersistence, 'getWorkInstructionById' as any)
      .mockResolvedValue({
        workInstructionId: 'instr-001',
        facilityId: 'facility-001',
        teamId: 'nonexistent-team-999',
        workInstructionNumber: 'WI-001',
        workName: 'Test Work',
        workDescription: null,
        plannedStartDateTime: '2025-01-20T09:00:00Z',
        plannedEndDateTime: '2025-01-20T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '未開始',
        progressRate: 0,
        requiredWorkerCount: 5,
        priority: '高',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      });

    // Setup getWorkerById stub: return valid worker object
    getWorkerByIdSpy = jest
      .spyOn(dataPersistence, 'getWorkerById' as any)
      .mockResolvedValue({
        workerId: 'worker-001',
        workerName: 'Test Worker',
        facilityId: 'facility-001',
        teamId: 'nonexistent-team-999',
        jobType: 'operator',
        operatingStatus: '稼働中',
        hourlyRate: 1500,
        maxWorkingHours: 8,
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      });

    // Setup getFacilityById stub: return valid facility object
    getFacilityByIdSpy = jest
      .spyOn(dataPersistence, 'getFacilityById' as any)
      .mockResolvedValue({
        facilityId: 'facility-001',
        facilityName: 'Test Facility',
        facilityCode: 'FAC-001',
        address: '123 Test St',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: 'Manager',
        contactInfo: '090-1234-5678',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

    // Setup validateDateTimeRange stub: return success
    validateDateTimeRangeSpy = jest
      .spyOn(dataPersistence, 'validateDateTimeRange' as any)
      .mockResolvedValue(true);

    // Setup validateNumericQuantity stub: return success
    validateNumericQuantitySpy = jest
      .spyOn(dataPersistence, 'validateNumericQuantity' as any)
      .mockResolvedValue(true);

    // Setup validateReferentialIntegrity stub: return success
    validateReferentialIntegritySpy = jest
      .spyOn(dataPersistence, 'validateReferentialIntegrity' as any)
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw TeamNotFound error when specified teamId does not exist', async () => {
    // Arrange
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'nonexistent-team-999',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-20T09:00:00Z',
      plannedEndDateTime: '2025-01-20T17:00:00Z',
      actualStartDateTime: '2025-01-20T09:15:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 25,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    // Act & Assert
    await expect(saveAllocationExecutionStatus(input)).rejects.toMatchObject({
      name: 'TeamNotFound',
      message: '指定されたチームが見つかりません。',
    });
  });
});