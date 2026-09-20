import { saveProficiency } from '../../src/logic/data-persistence';
import * as datePersistence from '../../src/logic/data-persistence';

describe('SCEN-632: 作業者習熟度データ新規作成時のisNewRecord検証', () => {
  let getWorkerByIdMock: jest.Mock;
  let validateDateTimeRangeMock: jest.Mock;

  beforeEach(() => {
    getWorkerByIdMock = jest.fn();
    validateDateTimeRangeMock = jest.fn();

    jest.spyOn(dataPersistence, 'getWorkerById').mockImplementation(getWorkerByIdMock);
    jest.spyOn(dataPersistence, 'validateDateTimeRange').mockImplementation(validateDateTimeRangeMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('新規作成時の出力でisNewRecordがtrueに設定される', async () => {
    // Arrange: 入力値を用意する
    const input = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
      updatedBy: null,
    };

    // getWorkerByIdをスタブ化
    getWorkerByIdMock.mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: '梱包',
      operatingStatus: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'C001',
      updatedBy: null,
    });

    // validateDateTimeRangeをスタブ化
    validateDateTimeRangeMock.mockResolvedValue(true);

    // Act: saveProficiency関数を呼び出す
    const result = await saveProficiency(input);

    // Assert: 出力値を検証する
    expect(result).toBeDefined();
    expect(result.isNewRecord).toBe(true);
    expect(result.proficiencyId).toBeTruthy();
    expect(typeof result.proficiencyId).toBe('string');
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('梱包');
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.savedAt).toBeTruthy();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);
  });
});