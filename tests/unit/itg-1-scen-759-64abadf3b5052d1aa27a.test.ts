import {
  saveAllocationPlan,
  getFacilityById,
  getTeamById,
  getWorkInstructionById,
} from '../../src/logic/data-persistence';
import { SaveAllocationPlanInput, SaveAllocationPlanOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => {
  const actualModule = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actualModule,
    getFacilityById: jest.fn(),
    getTeamById: jest.fn(),
    getWorkInstructionById: jest.fn(),
    validateDateTimeRange: jest.fn(),
    validateNumericQuantity: jest.fn(),
    validateReferentialIntegrity: jest.fn(),
  };
});

describe('SCEN-759: 既存の配置案IDを指定して既存レコードを更新する場合', () => {
  let mockGetFacilityById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetFacilityById = getFacilityById as jest.Mock;
    mockGetTeamById = getTeamById as jest.Mock;
    mockGetWorkInstructionById = getWorkInstructionById as jest.Mock;
  });

  describe('既存の配置案IDを指定した場合', () => {
    it('既存の配置案IDを指定して更新した場合、isNewRecordがfalseで返される', async () => {
      const existingAllocationPlanId = 'plan-001-update';
      const facilityId = 'facility-001';
      const teamId = 'team-001';
      const workInstructionId = 'work-instr-001';
      const planName = '拠点A_チームB_2024-01-15_更新配置案';
      const allocationStartDate = '2024-01-15T09:00:00Z';
      const allocationEndDate = '2024-01-20T18:00:00Z';
      const estimatedWorkHours = 80;
      const estimatedCompletionDate = '2024-01-19T17:00:00Z';
      const status = '承認済み';
      const createdBy = 'user-001';
      const updatedBy = 'user-002';

      const input: SaveAllocationPlanInput = {
        allocationPlanId: existingAllocationPlanId,
        planName,
        facilityId,
        teamId,
        workInstructionId,
        allocationStartDate,
        allocationEndDate,
        estimatedWorkHours,
        estimatedCompletionDate,
        status,
        createdBy,
        updatedBy,
      };

      mockGetFacilityById.mockResolvedValue({
        facilityId,
        facilityName: '拠点A',
        facilityCode: 'FAC001',
        address: '東京都',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: '責任者1',
        contactInfo: '090-xxxx-xxxx',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

      mockGetTeamById.mockResolvedValue({
        teamId,
        teamName: 'チームB',
        facilityId,
        teamLeaderId: 'leader-001',
        teamDescription: 'チームの説明',
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

      mockGetWorkInstructionById.mockResolvedValue({
        workInstructionId,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-001',
        workName: '製品組立',
        workDescription: '製品の組立作業',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-20T18:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 45,
        requiredWorkerCount: 5,
        priority: '高',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      });

      const result = await saveAllocationPlan(input);

      expect(result).toBeDefined();
      expect(result.allocationPlanId).toBe(existingAllocationPlanId);
      expect(result.planName).toBe(planName);
      expect(result.facilityId).toBe(facilityId);
      expect(result.teamId).toBe(teamId);
      expect(result.workInstructionId).toBe(workInstructionId);
      expect(result.status).toBe(status);
      expect(result.isNewRecord).toBe(false);
      expect(result.savedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/
      );

      expect(mockGetFacilityById).toHaveBeenCalledWith({ facilityId });
      expect(mockGetTeamById).toHaveBeenCalledWith({ teamId });
      expect(mockGetWorkInstructionById).toHaveBeenCalledWith({
        workInstructionId,
      });
    });

    it('入力値が正常な範囲内で、出力フィールドが全て期待値と一致すること', async () => {
      const allocationPlanId = 'plan-002-update';
      const facilityId = 'facility-002';
      const teamId = 'team-002';
      const workInstructionId = 'work-instr-002';
      const planName = '更新配置案_v2';
      const allocationStartDate = '2024-01-16T08:00:00Z';
      const allocationEndDate = '2024-01-21T17:00:00Z';
      const estimatedWorkHours = 96;
      const estimatedCompletionDate = '2024-01-20T16:00:00Z';
      const status = '実行中';
      const createdBy = 'user-003';
      const updatedBy = 'user-004';
      const description = '更新版の配置案です';

      const input: SaveAllocationPlanInput = {
        allocationPlanId,
        planName,
        facilityId,
        teamId,
        workInstructionId,
        allocationStartDate,
        allocationEndDate,
        estimatedWorkHours,
        estimatedCompletionDate,
        status,
        description,
        createdBy,
        updatedBy,
      };

      mockGetFacilityById.mockResolvedValue({
        facilityId,
        facilityName: '拠点B',
        facilityCode: 'FAC002',
        address: '大阪府',
        maxCapacity: 150,
        currentCapacity: 75,
        operatingStatus: 'active',
        responsiblePersonName: '責任者2',
        contactInfo: 'admin@facility-b.co.jp',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

      mockGetTeamById.mockResolvedValue({
        teamId,
        teamName: 'チームC',
        facilityId,
        teamLeaderId: 'leader-002',
        teamDescription: null,
        operatingStatus: 'active',
        capacity: 12,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

      mockGetWorkInstructionById.mockResolvedValue({
        workInstructionId,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-002',
        workName: '検品作業',
        workDescription: null,
        plannedStartDateTime: '2024-01-16T08:00:00Z',
        plannedEndDateTime: '2024-01-21T17:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: '進行中',
        progressRate: 60,
        requiredWorkerCount: 6,
        priority: '中',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-16T09:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      });

      const result = await saveAllocationPlan(input);

      expect(result.allocationPlanId).toBe(allocationPlanId);
      expect(result.planName).toBe(planName);
      expect(result.facilityId).toBe(facilityId);
      expect(result.teamId).toBe(teamId);
      expect(result.workInstructionId).toBe(workInstructionId);
      expect(result.status).toBe(status);
      expect(result.isNewRecord).toBe(false);
      expect(result.savedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/
      );

      expect(mockGetFacilityById).toHaveBeenCalledWith({ facilityId });
      expect(mockGetTeamById).toHaveBeenCalledWith({ teamId });
      expect(mockGetWorkInstructionById).toHaveBeenCalledWith({
        workInstructionId,
      });
    });

    it('指定されたIDのレコードが正常に更新され、永続化が成功すること', async () => {
      const allocationPlanId = 'plan-003-update';
      const facilityId = 'facility-003';
      const teamId = 'team-003';
      const workInstructionId = 'work-instr-003';
      const planName = 'テスト配置案_更新';
      const allocationStartDate = '2024-01-17T10:00:00Z';
      const allocationEndDate = '2024-01-22T19:00:00Z';
      const estimatedWorkHours = 72;
      const estimatedCompletionDate = '2024-01-21T18:00:00Z';
      const status = '完了';
      const createdBy = 'user-005';
      const updatedBy = 'user-006';

      const input: SaveAllocationPlanInput = {
        allocationPlanId,
        planName,
        facilityId,
        teamId,
        workInstructionId,
        allocationStartDate,
        allocationEndDate,
        estimatedWorkHours,
        estimatedCompletionDate,
        status,
        createdBy,
        updatedBy,
      };

      mockGetFacilityById.mockResolvedValue({
        facilityId,
        facilityName: '拠点C',
        facilityCode: 'FAC003',
        address: '福岡県',
        maxCapacity: 120,
        currentCapacity: 60,
        operatingStatus: 'active',
        responsiblePersonName: '責任者3',
        contactInfo: 'contact@facility-c.co.jp',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

      mockGetTeamById.mockResolvedValue({
        teamId,
        teamName: 'チームD',
        facilityId,
        teamLeaderId: 'leader-003',
        teamDescription: '検品チーム',
        operatingStatus: 'active',
        capacity: 8,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: null,
      });

      mockGetWorkInstructionById.mockResolvedValue({
        workInstructionId,
        facilityId,
        teamId,
        workInstructionNumber: 'WI-003',
        workName: '梱包作業',
        workDescription: '製品の梱包',
        plannedStartDateTime: '2024-01-17T10:00:00Z',
        plannedEndDateTime: '2024-01-22T19:00:00Z',
        actualStartDateTime: '2024-01-17T10:30:00Z',
        actualEndDateTime: null,
        progressStatus: '完了',
        progressRate: 100,
        requiredWorkerCount: 4,
        priority: '低',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-17T11:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      });

      const result = await saveAllocationPlan(input);

      expect(result).toBeDefined();
      expect(result.allocationPlanId).toBe(allocationPlanId);
      expect(result.planName).toBe(planName);
      expect(result.facilityId).toBe(facilityId);
      expect(result.teamId).toBe(teamId);
      expect(result.workInstructionId).toBe(workInstructionId);
      expect(result.status).toBe(status);
      expect(result.isNewRecord).toBe(false);
      expect(typeof result.savedAt).toBe('string');
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
    });
  });
});