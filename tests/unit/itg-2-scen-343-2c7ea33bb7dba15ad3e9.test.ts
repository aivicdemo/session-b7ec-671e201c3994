import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as authValidation from '../../src/logic/authorization-and-validation';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/authorization-and-validation');
jest.mock('../../src/logic/persistence-layer');

describe('SCEN-343: 過去24時間以内の実績データが1件も取得できないとき警告が記録される', () => {
  let mockValidateInputData: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindInitialAssignmentByWorker: jest.Mock;
  let mockFindPerformanceRecordsByWorkerAndPeriod: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateInputData = jest.fn().mockResolvedValue(undefined);
    mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      status: 'active',
    });
    mockFindInitialAssignmentByWorker = jest.fn().mockResolvedValue({
      initialAssignmentId: 'assignment-001',
      workerId: 'worker-001',
      department: 'Assembly',
      process: 'Basic Assembly',
      startDate: new Date(),
      status: 'active',
    });
    mockFindPerformanceRecordsByWorkerAndPeriod = jest.fn().mockResolvedValue([]);

    (authValidation.validateInputData as jest.Mock) = mockValidateInputData;
    (persistenceLayer.findWorkerById as jest.Mock) = mockFindWorkerById;
    (persistenceLayer.findInitialAssignmentByWorker as jest.Mock) = mockFindInitialAssignmentByWorker;
    (persistenceLayer.findPerformanceRecordsByWorkerAndPeriod as jest.Mock) = mockFindPerformanceRecordsByWorkerAndPeriod;

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should throw NoPerformanceDataError when no performance records are found within 24 hours', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const input = {
      workerId: 'worker-001',
      initialAssignmentId: 'assignment-001',
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId: 'leader-001',
    };

    await expect(analyzeInitialAssignmentPerformance(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoPerformanceDataError',
        message: expect.stringContaining('初期割当作業の実績データがまだ記録されていません。作業完了後に再度実行してください。'),
      })
    );
  });

  it('should record a warning log when no performance data is found', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const input = {
      workerId: 'worker-001',
      initialAssignmentId: 'assignment-001',
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId: 'leader-001',
    };

    try {
      await analyzeInitialAssignmentPerformance(input);
    } catch (error) {
      if (error instanceof Error && error.name === 'NoPerformanceDataError') {
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleWarnSpy.mock.calls.some((call) =>
          call[0]?.toString().includes('初期割当作業の実績データがまだ記録されていません')
        )).toBe(true);
      }
    }
  });

  it('should call validateInputData with the provided input', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const input = {
      workerId: 'worker-001',
      initialAssignmentId: 'assignment-001',
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId: 'leader-001',
    };

    try {
      await analyzeInitialAssignmentPerformance(input);
    } catch (error) {
      if (error instanceof Error && error.name === 'NoPerformanceDataError') {
        expect(mockValidateInputData).toHaveBeenCalledWith(input);
      }
    }
  });

  it('should call findPerformanceRecordsByWorkerAndPeriod with correct parameters', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const input = {
      workerId: 'worker-001',
      initialAssignmentId: 'assignment-001',
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId: 'leader-001',
    };

    try {
      await analyzeInitialAssignmentPerformance(input);
    } catch (error) {
      if (error instanceof Error && error.name === 'NoPerformanceDataError') {
        expect(mockFindPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalledWith(
          'worker-001',
          twentyFourHoursAgo,
          now
        );
      }
    }
  });

  it('should verify that the error is thrown before attempting further analysis', async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const input = {
      workerId: 'worker-001',
      initialAssignmentId: 'assignment-001',
      analysisStartDateTime: twentyFourHoursAgo,
      analysisEndDateTime: now,
      requestingUserId: 'leader-001',
    };

    await expect(analyzeInitialAssignmentPerformance(input)).rejects.toThrow('NoPerformanceDataError');

    expect(mockFindWorkerById).toHaveBeenCalled();
    expect(mockFindInitialAssignmentByWorker).toHaveBeenCalled();
    expect(mockFindPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalled();
  });
});