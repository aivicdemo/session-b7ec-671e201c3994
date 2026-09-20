import { saveProficiency } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-639: jobTypeが定義済み値域外だと職務区分無効エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidJobType error when jobType is outside defined valid range', async () => {
    // getWorkerByIdをスタブ化
    const mockWorker = {
      workerId: 'W001',
      workerName: 'Test Worker',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'C001',
    };

    jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue(mockWorker);

    // validateDateTimeRangeをスタブ化（過去日付が妥当であることを表現）
    jest.spyOn(dataPersistence, 'validateDateTimeRange').mockResolvedValue(true);

    const input = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: 'INVALID_JOB_TYPE',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      createdBy: 'C001',
      remarks: null,
      updatedBy: undefined,
    };

    let thrownError: any;
    let result: any;

    try {
      result = await saveProficiency(input);
      fail('Expected InvalidJobType error to be thrown');
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('InvalidJobType');
    expect(thrownError.message).toBe('職務区分 INVALID_JOB_TYPE は無効です。');
    expect(result).toBeUndefined();
  });
});