import { saveAllocationPlan, getFacilityById, getTeamById, getWorkInstructionById, validateDateTimeRange, validateNumericQuantity, validateReferentialIntegrity } from '../../src/logic/data-persistence';
import { SaveAllocationPlanInput, SaveAllocationPlanOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    getFacilityById: jest.fn(),
    getTeamById: jest.fn(),
    getWorkInstructionById: jest.fn(),
    validateDateTimeRange: jest.fn(),
    validateNumericQuantity: jest.fn(),
    validateReferentialIntegrity: jest.fn(),
  };
});

describe('saveAllocationPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a new allocation plan successfully and return savedAt in ISO 8601 format with current timestamp', async () => {
    const testInput: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '承認待ち',
      description: 'テスト配置案',
      createdBy: 'USER001',
      updatedBy: null,
    };

    // スタブ化：getFacilityById
    (getFacilityById as jest.Mock).mockImplementation(async (input) => {
      if (input.facilityId === 'FAC001') {
        return {
          facilityId: 'FAC001',
          facilityName: 'テスト拠点A',
          facilityCode: 'FAC-A001',
          address: 'テスト住所',
          maxCapacity: 100,
          currentCapacity: 50,
          operatingStatus: 'active',
          responsiblePersonName: '責任者太郎',
          contactInfo: '090-xxxx-xxxx',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'ADMIN001',
          updatedBy: null,
        };
      }
      throw new Error('Facility not found');
    });

    // スタブ化：getTeamById
    (getTeamById as jest.Mock).mockImplementation(async (input) => {
      if (input.teamId === 'TEAM001') {
        return {
          teamId: 'TEAM001',
          teamName: 'テストチームB',
          facilityId: 'FAC001',
          teamLeaderId: 'LEADER001',
          teamDescription: 'テストチーム',
          operatingStatus: 'active',
          capacity: 20,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'ADMIN001',
          updatedBy: null,
        };
      }
      throw new Error('Team not found');
    });

    // スタブ化：getWorkInstructionById
    (getWorkInstructionById as jest.Mock).mockImplementation(async (input) => {
      if (input.workInstructionId === 'WI001') {
        return {
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workInstructionNumber: 'WI-001-2024',
          workName: 'テスト作業',
          workDescription: 'テスト作業説明',
          plannedStartDateTime: '2024-01-15T09:00:00Z',
          plannedEndDateTime: '2024-01-20T17:00:00Z',
          actualStartDateTime: null,
          actualEndDateTime: null,
          progressStatus: '未開始',
          progressRate: 0,
          requiredWorkerCount: 5,
          priority: '高',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'ADMIN001',
          updatedBy: null,
        };
      }
      throw new Error('Work instruction not found');
    });

    // スタブ化：validateDateTimeRange
    (validateDateTimeRange as jest.Mock).mockImplementation(async (startDate, endDate) => {
      if (startDate === '2024-01-15' && endDate === '2024-01-20') {
        return { valid: true };
      }
      throw new Error('Invalid date range');
    });

    // スタブ化：validateNumericQuantity
    (validateNumericQuantity as jest.Mock).mockImplementation(async (value) => {
      if (value === 40) {
        return { valid: true };
      }
      throw new Error('Invalid numeric quantity');
    });

    // スタブ化：validateReferentialIntegrity
    (validateReferentialIntegrity as jest.Mock).mockImplementation(async () => {
      return { valid: true };
    });

    const beforeExecutionTime = new Date();
    const result = await saveAllocationPlan(testInput);
    const afterExecutionTime = new Date();

    expect(result).toBeDefined();
    expect(result.allocationPlanId).not.toBeNull();
    expect(result.allocationPlanId).toBeTruthy();
    expect(typeof result.allocationPlanId).toBe('string');
    expect(result.planName).toBe('拠点A_チームB_2024-01-15_追加配置案');
    expect(result.facilityId).toBe('FAC001');
    expect(result.teamId).toBe('TEAM001');
    expect(result.workInstructionId).toBe('WI001');
    expect(result.status).toBe('承認待ち');
    expect(result.isNewRecord).toBe(true);

    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');

    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.savedAt).toMatch(iso8601Pattern);

    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThanOrEqual(beforeExecutionTime.getTime() - 1000);
    expect(savedAtDate.getTime()).toBeLessThanOrEqual(afterExecutionTime.getTime() + 5000);

    const expectedDate = beforeExecutionTime.toISOString().split('T')[0];
    const resultDate = result.savedAt.split('T')[0];
    expect(resultDate).toBe(expectedDate);

    expect(getFacilityById).toHaveBeenCalledWith(expect.objectContaining({ facilityId: 'FAC001' }));
    expect(getTeamById).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'TEAM001' }));
    expect(getWorkInstructionById).toHaveBeenCalledWith(expect.objectContaining({ workInstructionId: 'WI001' }));
    expect(validateDateTimeRange).toHaveBeenCalledWith('2024-01-15', '2024-01-20');
    expect(validateNumericQuantity).toHaveBeenCalledWith(40);
    expect(validateReferentialIntegrity).toHaveBeenCalled();
  });
});