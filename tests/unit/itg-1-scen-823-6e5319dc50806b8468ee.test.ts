import { saveAllocationExecutionStatus, getFacilityById, getAllocationPlanById, getWorkInstructionById, getWorkerById, getTeamById } from '../../src/logic/data-persistence';
import { jest } from '@jest/globals';

// Define FacilityNotFound error class
class FacilityNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FacilityNotFound';
  }
}

describe('SCEN-823: 指定された拠点IDが存在しない場合、FacilityNotFound エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw FacilityNotFound error when facilityId does not exist', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'PLAN-001',
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      facilityId: 'FACILITY-NONEXIST',
      teamId: 'TEAM-001',
      allocationState: '進行中',
      plannedStartDateTime: '2025-02-01T08:00:00Z',
      plannedEndDateTime: '2025-02-01T17:00:00Z',
      actualStartDateTime: '2025-02-01T08:30:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 50,
      delayFlag: false,
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    // Setup: Mock getFacilityById to return null for nonexistent facility
    jest.mocked(getFacilityById).mockResolvedValueOnce(null);

    // Setup: Mock getAllocationPlanById to return a valid allocation plan
    jest.mocked(getAllocationPlanById).mockResolvedValueOnce({
      allocationPlanId: 'PLAN-001',
      planName: 'Test Plan',
      facilityId: 'FACILITY-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocationStartDate: '2025-02-01',
      allocationEndDate: '2025-02-05',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2025-02-05',
      status: '承認済み',
      description: null,
      createdAt: '2025-01-25T10:00:00Z',
      updatedAt: '2025-01-25T10:00:00Z',
      createdBy: 'USER-001',
      updatedBy: null,
    });

    // Setup: Mock getWorkInstructionById to return a valid work instruction
    jest.mocked(getWorkInstructionById).mockResolvedValueOnce({
      workInstructionId: 'WI-001',
      facilityId: 'FACILITY-001',
      teamId: 'TEAM-001',
      workInstructionNumber: 'WI-20250201-001',
      workName: 'Test Work',
      workDescription: null,
      plannedStartDateTime: '2025-02-01T08:00:00Z',
      plannedEndDateTime: '2025-02-01T17:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '中',
      createdAt: '2025-01-25T10:00:00Z',
      updatedAt: '2025-01-25T10:00:00Z',
      createdBy: 'USER-001',
      updatedBy: null,
    });

    // Setup: Mock getWorkerById to return a valid worker
    jest.mocked(getWorkerById).mockResolvedValueOnce({
      workerId: 'W-001',
      workerName: 'Test Worker',
      facilityId: 'FACILITY-001',
      teamId: 'TEAM-001',
      jobType: 'assembler',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2025-01-20T10:00:00Z',
      updatedAt: '2025-01-20T10:00:00Z',
      createdBy: 'USER-001',
      updatedBy: null,
    });

    // Setup: Mock getTeamById to return a valid team
    jest.mocked(getTeamById).mockResolvedValueOnce({
      teamId: 'TEAM-001',
      teamName: 'Test Team',
      facilityId: 'FACILITY-001',
      teamLeaderId: 'LEADER-001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2025-01-20T10:00:00Z',
      updatedAt: '2025-01-20T10:00:00Z',
      createdBy: 'USER-001',
      updatedBy: null,
    });

    // Execute and verify
    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
      FacilityNotFound
    );
    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
      '指定された拠点が見つかりません。'
    );

    // Verify that getFacilityById was called with the nonexistent facility ID
    expect(jest.mocked(getFacilityById)).toHaveBeenCalledWith('FACILITY-NONEXIST');
  });
});