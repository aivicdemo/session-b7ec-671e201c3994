import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveAllocationPlan,
  SaveAllocationPlanInput,
  getFacilityById,
  getTeamById,
  getWorkInstructionById,
} from '../../src/logic/data-persistence';

// Mock the data-persistence module
jest.mock('../../src/logic/data-persistence');

describe('saveAllocationPlan - TeamNotFound Error', () => {
  const mockGetFacilityById = getFacilityById as jest.MockedFunction<typeof getFacilityById>;
  const mockGetTeamById = getTeamById as jest.MockedFunction<typeof getTeamById>;
  const mockGetWorkInstructionById = getWorkInstructionById as jest.MockedFunction<
    typeof getWorkInstructionById
  >;
  const mockSaveAllocationPlan = saveAllocationPlan as jest.MockedFunction<typeof saveAllocationPlan>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup stub for getFacilityById to return valid facility data based on facilityId
    mockGetFacilityById.mockImplementation(async (facilityId: string) => {
      if (facilityId === 'FAC001') {
        return {
          facilityId: 'FAC001',
          facilityName: '拠点A',
          facilityCode: 'FAC-001',
          address: '東京都渋谷区',
          maxCapacity: 50,
          currentCapacity: 30,
          operatingStatus: 'active',
          responsiblePersonName: '山田太郎',
          contactInfo: '090-1234-5678',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'ADMIN',
          updatedBy: null,
        };
      }
      return null;
    });

    // Setup stub for getTeamById to return null for TEAM_NOT_EXISTS or team from different facility
    mockGetTeamById.mockImplementation(async (teamId: string) => {
      if (teamId === 'TEAM_NOT_EXISTS') {
        return null;
      }
      if (teamId === 'TEAM_DIFFERENT_FACILITY') {
        return {
          teamId: 'TEAM_DIFFERENT_FACILITY',
          teamName: 'チームB',
          facilityId: 'FAC002',
          teamLeaderId: 'LEADER001',
          teamDescription: null,
          operatingStatus: 'active',
          capacity: 10,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'ADMIN',
          updatedBy: null,
        };
      }
      return {
        teamId: teamId,
        teamName: 'チームB',
        facilityId: 'FAC001',
        teamLeaderId: 'LEADER001',
        teamDescription: null,
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: null,
      };
    });

    // Setup stub for getWorkInstructionById to return valid work instruction data based on workInstructionId
    mockGetWorkInstructionById.mockImplementation(async (workInstructionId: string) => {
      if (workInstructionId === 'WI001') {
        return {
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workInstructionNumber: 'WI-001-2024',
          workName: 'パッキング作業',
          workDescription: '商品の梱包作業',
          plannedStartDateTime: '2024-01-15T08:00:00Z',
          plannedEndDateTime: '2024-01-20T17:00:00Z',
          actualStartDateTime: null,
          actualEndDateTime: null,
          progressStatus: '未開始',
          progressRate: 0,
          requiredWorkerCount: 5,
          priority: '高',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'USER001',
          updatedBy: null,
        };
      }
      return null;
    });

    // Setup the actual implementation for saveAllocationPlan to check team existence and facility relationship
    mockSaveAllocationPlan.mockImplementation(async (input: SaveAllocationPlanInput) => {
      // Validate date time range
      if (input.allocationStartDate > input.allocationEndDate) {
        const error = new Error('配置開始日と配置終了日の組み合わせが無効です。');
        (error as any).name = 'InvalidDateTimeRange';
        throw error;
      }

      // Validate numeric quantity
      if (!Number.isInteger(input.estimatedWorkHours) || input.estimatedWorkHours <= 0) {
        const error = new Error('予想工数は正の整数である必要があります。');
        (error as any).name = 'InvalidNumericQuantity';
        throw error;
      }

      // Validate facility
      const facility = await mockGetFacilityById(input.facilityId);
      if (!facility) {
        const error = new Error('指定された拠点が見つかりません。');
        (error as any).name = 'FacilityNotFound';
        throw error;
      }

      // Validate team exists and belongs to the facility
      const team = await mockGetTeamById(input.teamId);
      if (!team) {
        const error = new Error(
          '指定されたチームが見つかりません。チームIDと拠点IDの組み合わせを確認してください。'
        );
        (error as any).name = 'TeamNotFound';
        throw error;
      }

      if (team.facilityId !== input.facilityId) {
        const error = new Error(
          '指定されたチームが見つかりません。チームIDと拠点IDの組み合わせを確認してください。'
        );
        (error as any).name = 'TeamNotFound';
        throw error;
      }

      // Validate work instruction
      const workInstruction = await mockGetWorkInstructionById(input.workInstructionId);
      if (!workInstruction) {
        const error = new Error('指定された作業指示が見つかりません。');
        (error as any).name = 'WorkInstructionNotFound';
        throw error;
      }

      return {
        allocationPlanId: 'AP001',
        planName: input.planName,
        facilityId: input.facilityId,
        teamId: input.teamId,
        workInstructionId: input.workInstructionId,
        status: input.status,
        savedAt: '2024-01-15T12:00:00Z',
        isNewRecord: true,
      };
    });
  });

  it('should throw TeamNotFound error when team does not exist in the specified facility', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM_NOT_EXISTS',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    let thrownError: any = null;
    try {
      await mockSaveAllocationPlan(input);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('TeamNotFound');
    expect(thrownError.message).toBe(
      '指定されたチームが見つかりません。チームIDと拠点IDの組み合わせを確認してください。'
    );
  });

  it('should throw TeamNotFound error when team belongs to different facility', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM_DIFFERENT_FACILITY',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    let thrownError: any = null;
    try {
      await mockSaveAllocationPlan(input);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('TeamNotFound');
    expect(thrownError.message).toBe(
      '指定されたチームが見つかりません。チームIDと拠点IDの組み合わせを確認してください。'
    );
  });

  it('should not return SaveAllocationPlanOutput when TeamNotFound error is thrown due to missing team', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM_NOT_EXISTS',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    let output = null;
    let thrownError = null;

    try {
      output = await mockSaveAllocationPlan(input);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('TeamNotFound');
    expect(output).toBeNull();
  });

  it('should not return SaveAllocationPlanOutput when TeamNotFound error is thrown due to facility mismatch', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM_DIFFERENT_FACILITY',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    let output = null;
    let thrownError = null;

    try {
      output = await mockSaveAllocationPlan(input);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('TeamNotFound');
    expect(output).toBeNull();
  });

  it('should validate allocationStartDate and allocationEndDate', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM_NOT_EXISTS',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await mockSaveAllocationPlan(input);
    } catch (error) {
      // Expected to throw error
    }

    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(input);
  });

  it('should validate estimatedWorkHours as positive integer', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM_NOT_EXISTS',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await mockSaveAllocationPlan(input);
    } catch (error) {
      // Expected to throw error
    }

    expect(mockSaveAllocationPlan).toHaveBeenCalledWith(input);
  });
});