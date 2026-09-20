import { saveAllocationPlan, SaveAllocationPlanInput, SaveAllocationPlanOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

class DatabaseError extends Error {
  constructor(message: string, public readonly type?: 'timeout' | 'connection_refused' | 'transaction_error') {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

describe('SCEN-770: saveAllocationPlanでデータベース接続エラーが発生した場合の挙動', () => {
  let mockGetFacilityById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockDatabaseInsert: jest.Mock;
  let saveAllocationPlanSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetFacilityById = jest.fn().mockResolvedValue({
      facilityId: 'FAC001',
      facilityName: '拠点A',
      facilityCode: 'FAC-A',
      address: '東京都',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: '090-1234-5678',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    mockGetTeamById = jest.fn().mockResolvedValue({
      teamId: 'TEAM001',
      teamName: 'チームB',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionNumber: 'WI-001',
      workName: '組立作業',
      workDescription: null,
      plannedStartDateTime: '2024-01-15T09:00:00Z',
      plannedEndDateTime: '2024-01-20T18:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '高',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    mockValidateDateTimeRange = jest.fn().mockReturnValue({ isValid: true });
    mockValidateNumericQuantity = jest.fn().mockReturnValue({ isValid: true });
    mockValidateReferentialIntegrity = jest.fn().mockReturnValue({ isValid: true });

    mockDatabaseInsert = jest.fn().mockRejectedValue(
      new DatabaseError('人員配置案の保存に失敗しました。システム管理者に連絡してください。', 'timeout')
    );

    jest.spyOn(dataPersistence, 'getFacilityById' as any).mockImplementation(mockGetFacilityById);
    jest.spyOn(dataPersistence, 'getTeamById' as any).mockImplementation(mockGetTeamById);
    jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockImplementation(mockGetWorkInstructionById);
    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockImplementation(mockValidateDateTimeRange);
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockImplementation(mockValidateNumericQuantity);
    jest.spyOn(dataPersistence, 'validateReferentialIntegrity' as any).mockImplementation(mockValidateReferentialIntegrity);

    saveAllocationPlanSpy = jest.spyOn(dataPersistence, 'saveAllocationPlan').mockImplementation(async (saveInput) => {
      await mockGetFacilityById(saveInput.facilityId);
      await mockGetTeamById(saveInput.teamId);
      await mockGetWorkInstructionById(saveInput.workInstructionId);

      mockValidateDateTimeRange(saveInput.allocationStartDate, saveInput.allocationEndDate);
      mockValidateNumericQuantity(saveInput.estimatedWorkHours);
      mockValidateReferentialIntegrity(saveInput.facilityId, saveInput.teamId, saveInput.workInstructionId);

      return mockDatabaseInsert(saveInput);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('データベース接続エラーが発生した場合、DatabaseErrorが発生する', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 120,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      createdBy: 'USER001',
    };

    let thrownError: Error | null = null;
    let result: SaveAllocationPlanOutput | null = null;

    try {
      result = await saveAllocationPlan(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // 期待結果1: DatabaseErrorが発生する
    expect(thrownError).toBeInstanceOf(DatabaseError);
    expect(thrownError?.message).toBe('人員配置案の保存に失敗しました。システム管理者に連絡してください。');
    expect((thrownError as DatabaseError)?.type).toBe('timeout');

    // 期待結果2: SaveAllocationPlanOutputは返されず
    expect(result).toBeNull();

    // 前提条件の検証: 呼び出し先が正常に返すよう設定されている
    expect(mockGetFacilityById).toHaveBeenCalledWith('FAC001');
    expect(mockGetTeamById).toHaveBeenCalledWith('TEAM001');
    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI001');

    // 前提条件の検証: 検証処理が正常に完了している
    expect(mockValidateDateTimeRange).toHaveBeenCalledWith('2024-01-15', '2024-01-20');
    expect(mockValidateNumericQuantity).toHaveBeenCalledWith(120);
    expect(mockValidateReferentialIntegrity).toHaveBeenCalledWith('FAC001', 'TEAM001', 'WI001');

    // 期待結果3: データベースには新規レコードが保存されていない
    // (mockDatabaseInsertが呼ばれたが、エラーが発生したため保存されていないことを確認)
    expect(mockDatabaseInsert).toHaveBeenCalledWith(input);
    expect(mockDatabaseInsert).toHaveBeenCalledTimes(1);

    // 手順4の検証: saveAllocationPlanが呼び出されている
    expect(saveAllocationPlanSpy).toHaveBeenCalledWith(input);
  });

  it('接続拒否エラーが発生した場合、DatabaseErrorが発生する', async () => {
    mockDatabaseInsert.mockRejectedValueOnce(
      new DatabaseError('人員配置案の保存に失敗しました。システム管理者に連絡してください。', 'connection_refused')
    );

    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 120,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      createdBy: 'USER001',
    };

    let thrownError: Error | null = null;
    let result: SaveAllocationPlanOutput | null = null;

    try {
      result = await saveAllocationPlan(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(DatabaseError);
    expect((thrownError as DatabaseError)?.type).toBe('connection_refused');
    expect(result).toBeNull();
  });

  it('トランザクション制御エラーが発生した場合、DatabaseErrorが発生する', async () => {
    mockDatabaseInsert.mockRejectedValueOnce(
      new DatabaseError('人員配置案の保存に失敗しました。システム管理者に連絡してください。', 'transaction_error')
    );

    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 120,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      createdBy: 'USER001',
    };

    let thrownError: Error | null = null;
    let result: SaveAllocationPlanOutput | null = null;

    try {
      result = await saveAllocationPlan(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(DatabaseError);
    expect((thrownError as DatabaseError)?.type).toBe('transaction_error');
    expect(result).toBeNull();
  });
});