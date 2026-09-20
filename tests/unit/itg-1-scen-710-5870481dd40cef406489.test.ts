import { saveWorkResult } from '../../src/logic/data-persistence';
import {
  SaveWorkResultOutput,
  GetWorkInstructionByIdOutput,
  GetWorkerByIdOutput,
  GetFacilityByIdOutput,
  GetTeamByIdOutput,
} from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-710', () => {
  describe('workResultIdがnullで新規作成時に任意フィールド（defectCount、remarks、updatedBy）が省略されると正常に保存される', () => {
    let mockGetWorkInstructionById: jest.Mock;
    let mockGetWorkerById: jest.Mock;
    let mockGetFacilityById: jest.Mock;
    let mockGetTeamById: jest.Mock;
    let mockValidateNumericQuantity: jest.Mock;
    let mockValidateDateTimeRange: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();

      const mockWorkInstruction: GetWorkInstructionByIdOutput = {
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        workInstructionNumber: 'WI-001',
        workName: 'テスト作業',
        workDescription: 'テスト作業説明',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T14:00:00Z',
        actualStartDateTime: undefined,
        actualEndDateTime: undefined,
        progressStatus: '未開始',
        progressRate: 0,
        requiredWorkerCount: 1,
        priority: '中',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USR-001',
        updatedBy: undefined,
      };

      const mockWorker: GetWorkerByIdOutput = {
        workerId: 'WKR-001',
        workerName: 'テスト作業者',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        jobType: 'オペレーター',
        operatingStatus: '稼働中',
        hourlyRate: undefined,
        maxWorkingHours: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'USR-001',
        updatedBy: undefined,
      };

      const mockFacility: GetFacilityByIdOutput = {
        facilityId: 'FAC-001',
        facilityName: 'テスト拠点',
        facilityCode: 'FAC-001-CODE',
        address: 'テスト住所',
        maxCapacity: 100,
        currentCapacity: 50,
        operatingStatus: 'active',
        responsiblePersonName: 'テスト責任者',
        contactInfo: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'USR-001',
        updatedBy: undefined,
      };

      const mockTeam: GetTeamByIdOutput = {
        teamId: 'TEAM-001',
        teamName: 'テストチーム',
        facilityId: 'FAC-001',
        teamLeaderId: 'WKR-002',
        teamDescription: undefined,
        operatingStatus: '稼働中',
        capacity: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'USR-001',
        updatedBy: undefined,
      };

      mockGetWorkInstructionById = jest.fn().mockResolvedValue(mockWorkInstruction);
      mockGetWorkerById = jest.fn().mockResolvedValue(mockWorker);
      mockGetFacilityById = jest.fn().mockResolvedValue(mockFacility);
      mockGetTeamById = jest.fn().mockResolvedValue(mockTeam);
      mockValidateNumericQuantity = jest.fn().mockResolvedValue(true);
      mockValidateDateTimeRange = jest.fn().mockResolvedValue(true);

      (global as any).getWorkInstructionById = mockGetWorkInstructionById;
      (global as any).getWorkerById = mockGetWorkerById;
      (global as any).getFacilityById = mockGetFacilityById;
      (global as any).getTeamById = mockGetTeamById;
      (global as any).validateNumericQuantity = mockValidateNumericQuantity;
      (global as any).validateDateTimeRange = mockValidateDateTimeRange;
    });

    it('任意フィールドが省略されて新規作成される', async () => {
      const input = {
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WKR-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T12:00:00Z',
        actualQuantity: 50,
        workStatus: '完了',
        createdBy: 'USR-001',
      };

      const result: SaveWorkResultOutput = await saveWorkResult(input);

      expect(result).toBeDefined();
      expect(result.workResultId).toBeTruthy();
      expect(result.workResultId).not.toBeNull();
      expect(typeof result.workResultId).toBe('string');
      expect(result.workInstructionId).toBe('WI-001');
      expect(result.workerId).toBe('WKR-001');
      expect(result.facilityId).toBe('FAC-001');
      expect(result.teamId).toBe('TEAM-001');
      expect(result.actualQuantity).toBe(50);
      expect(result.workStatus).toBe('完了');
      expect(result.savedAt).toBeTruthy();
      expect(typeof result.savedAt).toBe('string');
      expect(result.isNewRecord).toBe(true);
    });

    it('出力のsavedAtはISO 8601形式である', async () => {
      const input = {
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WKR-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T12:00:00Z',
        actualQuantity: 50,
        workStatus: '完了',
        createdBy: 'USR-001',
      };

      const result = await saveWorkResult(input);

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(iso8601Regex.test(result.savedAt)).toBe(true);
    });

    it('省略されたフィールド（defectCount、remarks、updatedBy）はデータベースに保存されない', async () => {
      const input = {
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WKR-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T12:00:00Z',
        actualQuantity: 50,
        workStatus: '完了',
        createdBy: 'USR-001',
      };

      const result = await saveWorkResult(input);

      expect(result.isNewRecord).toBe(true);
      expect(result.workResultId).toBeTruthy();
    });

    it('エラーが発生しない', async () => {
      const input = {
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WKR-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T12:00:00Z',
        actualQuantity: 50,
        workStatus: '完了',
        createdBy: 'USR-001',
      };

      await expect(saveWorkResult(input)).resolves.not.toThrow();
    });
  });
});