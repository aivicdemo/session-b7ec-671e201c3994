import {
  saveWorkResult,
  SaveWorkResultInput,
  SaveWorkResultOutput,
  getWorkInstructionById,
  getWorkerById,
  getFacilityById,
  getTeamById,
  validateNumericQuantity,
  validateDateTimeRange,
} from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-709: 作業実績の永続化処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベース保存中にシステムエラーが発生するとDatabasePersistenceErrorエラーが発生する', async () => {
    const input: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TM-001',
      actualStartDateTime: '2024-01-15T09:00:00Z',
      actualEndDateTime: '2024-01-15T12:00:00Z',
      actualQuantity: 100,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-admin',
      updatedBy: null,
    };

    expect(input.actualQuantity).toBe(100);
    expect(typeof input.actualQuantity).toBe('number');
    expect(input.workResultId).toBeNull();
    expect(input.updatedBy).toBeNull();
    const startTime = new Date('2024-01-15T09:00:00Z').getTime();
    const endTime = new Date('2024-01-15T12:00:00Z').getTime();
    expect(startTime < endTime).toBe(true);

    const mockWorkInstruction = {
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TM-001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: 'テスト作業の説明',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T18:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: '進行中',
      progressRate: 50,
      requiredWorkerCount: 5,
      priority: '高',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'USR-admin',
      updatedBy: null,
    };

    const mockWorker = {
      workerId: 'WKR-001',
      workerName: 'テスト作業者',
      facilityId: 'FAC-001',
      teamId: 'TM-001',
      jobType: '職種A',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'USR-admin',
      updatedBy: null,
    };

    const mockFacility = {
      facilityId: 'FAC-001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC-001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'USR-admin',
      updatedBy: null,
    };

    const mockTeam = {
      teamId: 'TM-001',
      teamName: 'テストチーム',
      facilityId: 'FAC-001',
      teamLeaderId: 'WKR-LEADER',
      teamDescription: 'テストチーム説明',
      operatingStatus: '稼働中',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'USR-admin',
      updatedBy: null,
    };

    jest.spyOn(dataPersistence, 'getWorkInstructionById').mockResolvedValue(mockWorkInstruction);
    jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue(mockWorker);
    jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue(mockFacility);
    jest.spyOn(dataPersistence, 'getTeamById').mockResolvedValue(mockTeam);

    jest.spyOn(dataPersistence, 'validateNumericQuantity').mockResolvedValue(true);
    jest.spyOn(dataPersistence, 'validateDateTimeRange').mockResolvedValue(true);

    const systemErrors = [
      { name: 'DatabaseConnectionError', message: 'データベース接続タイムアウト' },
      { name: 'TransactionExecutionError', message: 'トランザクション実行エラー' },
      { name: 'ConstraintViolationError', message: '制約違反エラー' },
    ];

    for (const systemError of systemErrors) {
      jest.clearAllMocks();

      jest.spyOn(dataPersistence, 'getWorkInstructionById').mockResolvedValue(mockWorkInstruction);
      jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue(mockWorker);
      jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue(mockFacility);
      jest.spyOn(dataPersistence, 'getTeamById').mockResolvedValue(mockTeam);
      jest.spyOn(dataPersistence, 'validateNumericQuantity').mockResolvedValue(true);
      jest.spyOn(dataPersistence, 'validateDateTimeRange').mockResolvedValue(true);

      const dbError = new Error(systemError.message);
      dbError.name = systemError.name;

      jest.spyOn(dataPersistence, 'saveWorkResult').mockImplementationOnce(async () => {
        const databasePersistenceError = new Error(
          `作業実績の保存に失敗しました。エラー: ${dbError.message}`
        );
        databasePersistenceError.name = 'DatabasePersistenceError';
        throw databasePersistenceError;
      });

      let error: Error | null = null;
      let result: SaveWorkResultOutput | undefined = undefined;

      try {
        result = await saveWorkResult(input);
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.name).toBe('DatabasePersistenceError');
      expect(error?.message).toMatch(/^作業実績の保存に失敗しました。エラー: /);
      expect(error?.message).toContain(systemError.message);
      expect(result).toBeUndefined();
      
      if (error) {
        const errorMessage = error.message;
        const expectedFormat = /^作業実績の保存に失敗しました。エラー: .+$/;
        expect(errorMessage).toMatch(expectedFormat);
      }
    }
  });
});