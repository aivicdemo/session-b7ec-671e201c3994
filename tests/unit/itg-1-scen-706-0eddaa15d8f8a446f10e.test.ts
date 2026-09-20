import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual('../../src/logic/data-persistence'),
  validateDateTimeRange: jest.fn(),
  getWorkInstructionById: jest.fn(),
  getWorkerById: jest.fn(),
  getFacilityById: jest.fn(),
  getTeamById: jest.fn(),
}));

describe('SCEN-706: 実績開始日時が実績終了日時より後だとInvalidWorkResultDataエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('実績開始日時が終了日時より後の場合、InvalidWorkResultDataエラーが発生する', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T14:30:00Z',
      actualEndDateTime: '2024-01-15T14:00:00Z',
      actualQuantity: 100,
      workStatus: '進行中',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-ADMIN',
      updatedBy: null,
    };

    // validateDateTimeRangeをスタブ化し、開始日時が終了日時より後の場合、エラーをthrowするよう設定
    const invalidWorkResultDataError = new Error(
      '作業実績データが不正です。実績数量: 100, 開始: 2024-01-15T14:30:00Z, 終了: 2024-01-15T14:00:00Z'
    );
    invalidWorkResultDataError.name = 'InvalidWorkResultData';
    (dataPersistence.validateDateTimeRange as jest.Mock).mockImplementation(
      (startDateTime: string, endDateTime: string) => {
        // 開始日時が終了日時より後の場合、バリデーション失敗
        if (new Date(startDateTime) > new Date(endDateTime)) {
          throw invalidWorkResultDataError;
        }
      }
    );

    // getWorkInstructionByIdをスタブ化
    (dataPersistence.getWorkInstructionById as jest.Mock).mockResolvedValue({
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionNumber: 'WI-001',
      workName: 'Test Work',
      plannedStartDateTime: '2024-01-15T10:00:00Z',
      plannedEndDateTime: '2024-01-15T18:00:00Z',
      progressStatus: '進行中',
      requiredWorkerCount: 5,
      priority: '中',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
      createdBy: 'USR-ADMIN',
    });

    // getWorkerByIdをスタブ化
    (dataPersistence.getWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'WKR-001',
      workerName: 'Test Worker',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      jobType: 'Assembly',
      operatingStatus: '稼働中',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-ADMIN',
    });

    // getFacilityByIdをスタブ化
    (dataPersistence.getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'FAC-001',
      facilityName: 'Test Facility',
      facilityCode: 'FAC-001',
      address: '123 Test Street',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: 'John Doe',
      contactInfo: '09012345678',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-ADMIN',
    });

    // getTeamByIdをスタブ化
    (dataPersistence.getTeamById as jest.Mock).mockResolvedValue({
      teamId: 'TEAM-001',
      teamName: 'Test Team',
      facilityId: 'FAC-001',
      teamLeaderId: 'WKR-002',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-ADMIN',
    });

    let thrownError: Error | undefined;

    try {
      await saveWorkResult(input);
      fail('saveWorkResult should throw InvalidWorkResultData error');
    } catch (error) {
      thrownError = error as Error;
    }

    // InvalidWorkResultDataエラーが発生したことを検証
    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('InvalidWorkResultData');
    expect(thrownError?.message).toBe(
      '作業実績データが不正です。実績数量: 100, 開始: 2024-01-15T14:30:00Z, 終了: 2024-01-15T14:00:00Z'
    );

    // validateDateTimeRangeが正しい引数で呼び出されたことを検証
    expect(dataPersistence.validateDateTimeRange).toHaveBeenCalledWith(
      '2024-01-15T14:30:00Z',
      '2024-01-15T14:00:00Z'
    );
  });
});