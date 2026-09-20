import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-712: 実績開始日時と実績終了日時が同じ時刻の場合は正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // スタブ: getWorkInstructionById
    jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockResolvedValue({
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2024-01-15T09:00:00Z',
      plannedEndDateTime: '2024-01-15T18:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: '進行中',
      progressRate: 50,
      requiredWorkerCount: 5,
      priority: '中',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      createdBy: 'USR-001',
      updatedBy: null,
    });

    // スタブ: getWorkerById
    jest.spyOn(dataPersistence, 'getWorkerById' as any).mockResolvedValue({
      workerId: 'WKR-001',
      workerName: 'テスト作業者',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      jobType: '組立',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-001',
      updatedBy: null,
    });

    // スタブ: getFacilityById
    jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue({
      facilityId: 'FAC-001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: 'テスト責任者',
      contactInfo: '090-0000-0000',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-001',
      updatedBy: null,
    });

    // スタブ: getTeamById
    jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
      teamId: 'TEAM-001',
      teamName: 'テストチーム',
      facilityId: 'FAC-001',
      teamLeaderId: 'WKR-001',
      teamDescription: null,
      operatingStatus: '稼働中',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'USR-001',
      updatedBy: null,
    });

    // スタブ: validateNumericQuantity
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockImplementation((quantity: number) => {
      if (quantity >= 0 && Number.isInteger(quantity)) {
        return null; // 検証成功
      }
      throw new Error('Invalid quantity');
    });

    // スタブ: validateDateTimeRange
    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockImplementation(
      (startDateTime: string, endDateTime: string) => {
        const start = new Date(startDateTime).getTime();
        const end = new Date(endDateTime).getTime();
        if (start > end) {
          throw new Error('Start datetime is after end datetime');
        }
        return null; // 検証成功（同一時刻または開始が終了より前の場合）
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('同じ開始・終了時刻で新規作成が正常に完了する', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result).toBeDefined();
    expect(result.workResultId).toBeDefined();
    expect(result.workResultId).not.toBeNull();
    expect(typeof result.workResultId).toBe('string');
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-001');
    expect(result.actualQuantity).toBe(50);
    expect(result.workStatus).toBe('完了');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);
    expect(result.isNewRecord).toBe(true);
  });

  it('同一時刻でも実績データが正常に保存される', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result.workResultId).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(new Date(result.savedAt).getTime()).toBeGreaterThan(0);
  });

  it('例外がスローされない', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    await expect(saveWorkResult(input)).resolves.toBeDefined();
  });

  it('新規作成フラグが true で返される', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result.isNewRecord).toBe(true);
  });

  it('出力に必須フィールドがすべて含まれる', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result).toHaveProperty('workResultId');
    expect(result).toHaveProperty('workInstructionId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('actualQuantity');
    expect(result).toHaveProperty('workStatus');
    expect(result).toHaveProperty('savedAt');
    expect(result).toHaveProperty('isNewRecord');
  });

  it('同一時刻の日時比較でバリデーション成功となる', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const validateDateTimeRangeSpy = jest.spyOn(dataPersistence, 'validateDateTimeRange' as any);

    const result = await saveWorkResult(input);

    expect(result).toBeDefined();
    expect(result.workResultId).not.toBeNull();
    expect(validateDateTimeRangeSpy).toHaveBeenCalledWith(
      '2024-01-15T10:00:00Z',
      '2024-01-15T10:00:00Z'
    );
  });

  it('actualQuantity が0以上の整数で検証成功となる', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 0,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const validateNumericQuantitySpy = jest.spyOn(dataPersistence, 'validateNumericQuantity' as any);

    const result = await saveWorkResult(input);

    expect(result.actualQuantity).toBe(0);
    expect(result.isNewRecord).toBe(true);
    expect(validateNumericQuantitySpy).toHaveBeenCalledWith(0);
  });

  it('参照エンティティが存在する場合、正常に作成される', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T10:00:00Z',
      actualQuantity: 50,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR-001',
      updatedBy: null,
    };

    const getWorkInstructionByIdSpy = jest.spyOn(dataPersistence, 'getWorkInstructionById' as any);
    const getWorkerByIdSpy = jest.spyOn(dataPersistence, 'getWorkerById' as any);
    const getFacilityByIdSpy = jest.spyOn(dataPersistence, 'getFacilityById' as any);
    const getTeamByIdSpy = jest.spyOn(dataPersistence, 'getTeamById' as any);

    const result = await saveWorkResult(input);

    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-001');
    expect(getWorkInstructionByIdSpy).toHaveBeenCalledWith('WI-001');
    expect(getWorkerByIdSpy).toHaveBeenCalledWith('WKR-001');
    expect(getFacilityByIdSpy).toHaveBeenCalledWith('FAC-001');
    expect(getTeamByIdSpy).toHaveBeenCalledWith('TEAM-001');
  });
});