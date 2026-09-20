import { analyzeInitialAssignmentPerformance } from '../../src/logic/initial-assignment-performance-analysis';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as authorizationAndValidation from '../../src/logic/authorization-and-validation';
import * as notificationAndIntegration from '../../src/logic/notification-and-integration';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/authorization-and-validation');
jest.mock('../../src/logic/notification-and-integration');

describe('analyzeInitialAssignmentPerformance - Worker Not Found Error', () => {
  const mockPersistenceLayer = persistenceLayer as jest.Mocked<typeof persistenceLayer>;
  const mockAuthValidation = authorizationAndValidation as jest.Mocked<typeof authorizationAndValidation>;
  const mockNotification = notificationAndIntegration as jest.Mocked<typeof notificationAndIntegration>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFoundError when worker ID does not exist', async () => {
    const workerId = 'WORKER_NOT_EXIST_001';
    const initialAssignmentId = 'ASSIGN_001';
    const now = new Date();
    const analysisStartDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = now;
    const requestingUserId = 'LEADER_001';

    mockAuthValidation.validateInputData.mockResolvedValue(undefined);
    mockPersistenceLayer.findWorkerById.mockResolvedValue(null);

    const input = {
      workerId,
      initialAssignmentId,
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId,
    };

    await expect(analyzeInitialAssignmentPerformance(input)).rejects.toMatchObject({
      name: 'WorkerNotFoundError',
      message: '新配属者の情報が見つかりません。作業者IDを確認してください。',
    });

    expect(mockPersistenceLayer.findWorkerById).toHaveBeenCalledTimes(1);
    expect(mockPersistenceLayer.findWorkerById).toHaveBeenCalledWith(workerId);
    expect(mockPersistenceLayer.findInitialAssignmentByWorker).not.toHaveBeenCalled();
    expect(mockPersistenceLayer.findPerformanceRecordsByWorkerAndPeriod).not.toHaveBeenCalled();
    expect(mockNotification.sendInitialAssignmentPerformanceAnalysisToLeader).not.toHaveBeenCalled();
  });
});