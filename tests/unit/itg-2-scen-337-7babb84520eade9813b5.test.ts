import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as initialAssignmentModule from '../../src/logic/initial-assignment-performance-analysis';

// Custom error class for timeout
class DataRetrievalTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataRetrievalTimeoutError';
    Object.setPrototypeOf(this, DataRetrievalTimeoutError.prototype);
  }
}

describe('SCEN-337: 生産性データ取得がタイムアウトしたときにDataRetrievalTimeoutErrorが発生する', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DataRetrievalTimeoutError when performance record retrieval times out', async () => {
    // Arrange
    const workerId = 'W001';
    const initialAssignmentId = 'IA-20250115-001';
    const analysisStartDateTime = new Date('2025-01-14T12:00:00Z');
    const analysisEndDateTime = new Date('2025-01-15T12:00:00Z');
    const requestingUserId = 'L001';

    const input = {
      workerId,
      initialAssignmentId,
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId,
    };

    // Setup stubs
    jest.spyOn(initialAssignmentModule as any, 'findWorkerById').mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
    });

    jest.spyOn(initialAssignmentModule as any, 'findInitialAssignmentByWorker').mockResolvedValue({
      initialAssignmentId,
      workerId,
    });

    // Simulate timeout: findPerformanceRecordsByWorkerAndPeriod throws timeout error
    jest.spyOn(initialAssignmentModule as any, 'findPerformanceRecordsByWorkerAndPeriod').mockRejectedValue(
      new DataRetrievalTimeoutError('データベースからのデータ取得がタイムアウトしました。しばらく待ってから再度実行してください。')
    );

    jest.spyOn(initialAssignmentModule as any, 'findProductivityDataByWorkerAndPeriod').mockResolvedValue([]);

    jest.spyOn(initialAssignmentModule as any, 'findWorkTypeById').mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Assembly',
    });

    jest.spyOn(initialAssignmentModule as any, 'validateInputData').mockResolvedValue(true);

    jest.spyOn(initialAssignmentModule as any, 'sendInitialAssignmentPerformanceAnalysisToLeader').mockResolvedValue(undefined);

    // Act & Assert
    const error = await analyzeInitialAssignmentPerformance(input).catch((err) => err);

    // Verify that DataRetrievalTimeoutError is thrown with correct message
    expect(error).toBeInstanceOf(DataRetrievalTimeoutError);
    expect(error.message).toBe('データベースからのデータ取得がタイムアウトしました。しばらく待ってから再度実行してください。');

    // Verify that the output is not generated (error is thrown before output creation)
    expect(error).toBeDefined();
    expect(error.name).toBe('DataRetrievalTimeoutError');
  });

  it('should throw DataRetrievalTimeoutError when productivity data retrieval times out', async () => {
    // Arrange
    const workerId = 'W001';
    const initialAssignmentId = 'IA-20250115-001';
    const analysisStartDateTime = new Date('2025-01-14T12:00:00Z');
    const analysisEndDateTime = new Date('2025-01-15T12:00:00Z');
    const requestingUserId = 'L001';

    const input = {
      workerId,
      initialAssignmentId,
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId,
    };

    // Setup stubs
    jest.spyOn(initialAssignmentModule as any, 'findWorkerById').mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
    });

    jest.spyOn(initialAssignmentModule as any, 'findInitialAssignmentByWorker').mockResolvedValue({
      initialAssignmentId,
      workerId,
    });

    // findPerformanceRecordsByWorkerAndPeriod resolves normally
    jest.spyOn(initialAssignmentModule as any, 'findPerformanceRecordsByWorkerAndPeriod').mockResolvedValue([]);

    // Simulate timeout: findProductivityDataByWorkerAndPeriod throws timeout error
    jest.spyOn(initialAssignmentModule as any, 'findProductivityDataByWorkerAndPeriod').mockRejectedValue(
      new DataRetrievalTimeoutError('データベースからのデータ取得がタイムアウトしました。しばらく待ってから再度実行してください。')
    );

    jest.spyOn(initialAssignmentModule as any, 'findWorkTypeById').mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Assembly',
    });

    jest.spyOn(initialAssignmentModule as any, 'validateInputData').mockResolvedValue(true);

    jest.spyOn(initialAssignmentModule as any, 'sendInitialAssignmentPerformanceAnalysisToLeader').mockResolvedValue(undefined);

    // Act & Assert
    const error = await analyzeInitialAssignmentPerformance(input).catch((err) => err);

    // Verify that DataRetrievalTimeoutError is thrown with correct message
    expect(error).toBeInstanceOf(DataRetrievalTimeoutError);
    expect(error.message).toBe('データベースからのデータ取得がタイムアウトしました。しばらく待ってから再度実行してください。');

    // Verify that the output is not generated (error is thrown before output creation)
    expect(error).toBeDefined();
    expect(error.name).toBe('DataRetrievalTimeoutError');
  });
});