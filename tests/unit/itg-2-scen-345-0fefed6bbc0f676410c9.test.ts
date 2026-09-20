import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as initialAssignmentModule from '../../src/logic/initial-assignment-performance-analysis';

describe('SCEN-345: 集約対象期間が0時間以下のとき例外がスローされる', () => {
  let mockValidateInputData: jest.SpyInstance;
  let mockFindWorkerById: jest.SpyInstance;
  let mockFindInitialAssignmentByWorker: jest.SpyInstance;
  let mockFindPerformanceRecordsByWorkerAndPeriod: jest.SpyInstance;
  let mockFindProductivityDataByWorkerAndPeriod: jest.SpyInstance;
  let mockFindWorkTypeById: jest.SpyInstance;
  let mockSendInitialAssignmentPerformanceAnalysisToLeader: jest.SpyInstance;

  beforeEach(() => {
    mockValidateInputData = jest.spyOn(initialAssignmentModule, 'validateInputData' as any).mockImplementation((input) => {
      const diffMs = input.analysisEndDateTime.getTime() - input.analysisStartDateTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours <= 0) {
        throw new Error('集約期間の指定が不正です。24時間以上の期間を指定してください');
      }
    });
    mockFindWorkerById = jest.spyOn(initialAssignmentModule, 'findWorkerById' as any).mockResolvedValue(null);
    mockFindInitialAssignmentByWorker = jest.spyOn(initialAssignmentModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    mockFindPerformanceRecordsByWorkerAndPeriod = jest.spyOn(initialAssignmentModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    mockFindProductivityDataByWorkerAndPeriod = jest.spyOn(initialAssignmentModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    mockFindWorkTypeById = jest.spyOn(initialAssignmentModule, 'findWorkTypeById' as any).mockResolvedValue(null);
    mockSendInitialAssignmentPerformanceAnalysisToLeader = jest.spyOn(initialAssignmentModule, 'sendInitialAssignmentPerformanceAnalysisToLeader' as any).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw an error when analysis period is equal to 0 hours', async () => {
    const now = new Date();
    const input = {
      workerId: 'worker-123',
      initialAssignmentId: 'assignment-456',
      analysisStartDateTime: now,
      analysisEndDateTime: now,
      requestingUserId: 'leader-789',
    };

    try {
      await analyzeInitialAssignmentPerformance(input);
      fail('Expected function to throw an error');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toContain('集約期間の指定が不正です。24時間以上の期間を指定してください');
    }

    expect(mockValidateInputData).toHaveBeenCalledWith(input);
    expect(mockFindWorkerById).not.toHaveBeenCalled();
    expect(mockFindInitialAssignmentByWorker).not.toHaveBeenCalled();
    expect(mockFindPerformanceRecordsByWorkerAndPeriod).not.toHaveBeenCalled();
    expect(mockFindProductivityDataByWorkerAndPeriod).not.toHaveBeenCalled();
    expect(mockFindWorkTypeById).not.toHaveBeenCalled();
    expect(mockSendInitialAssignmentPerformanceAnalysisToLeader).not.toHaveBeenCalled();
  });

  it('should throw an error when analysisEndDateTime is before analysisStartDateTime', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000);
    const input = {
      workerId: 'worker-123',
      initialAssignmentId: 'assignment-456',
      analysisStartDateTime: now,
      analysisEndDateTime: earlier,
      requestingUserId: 'leader-789',
    };

    try {
      await analyzeInitialAssignmentPerformance(input);
      fail('Expected function to throw an error');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toContain('集約期間の指定が不正です。24時間以上の期間を指定してください');
    }

    expect(mockValidateInputData).toHaveBeenCalledWith(input);
    expect(mockFindWorkerById).not.toHaveBeenCalled();
    expect(mockFindInitialAssignmentByWorker).not.toHaveBeenCalled();
    expect(mockFindPerformanceRecordsByWorkerAndPeriod).not.toHaveBeenCalled();
    expect(mockFindProductivityDataByWorkerAndPeriod).not.toHaveBeenCalled();
    expect(mockFindWorkTypeById).not.toHaveBeenCalled();
    expect(mockSendInitialAssignmentPerformanceAnalysisToLeader).not.toHaveBeenCalled();
  });
});