import {
  findInitialAssignmentByWorker,
  FindInitialAssignmentByWorkerInput,
  findWorkerById,
  FindWorkerByIdInput,
} from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  findWorkerById: jest.fn(),
}));

describe('SCEN-524: findInitialAssignmentByWorker - WorkerNotFound error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFound error when specified workerId does not exist in worker master', async () => {
    const mockFindWorkerById = persistenceLayer.findWorkerById as jest.MockedFunction<typeof findWorkerById>;
    mockFindWorkerById.mockResolvedValue({
      found: false,
      workerId: 'NONEXISTENT_WORKER_001',
      workerName: '',
      siteId: '',
      teamId: '',
      jobType: '',
      operatingStatus: '',
    });

    const input: FindInitialAssignmentByWorkerInput = {
      workerId: 'NONEXISTENT_WORKER_001',
      requestingUserId: 'valid_user_123',
    };

    try {
      await findInitialAssignmentByWorker(input);
      fail('Expected WorkerNotFound error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).name).toBe('WorkerNotFound');
      expect((error as Error).message).toBe('作業者が見つかりません。');
    }
  });

  it('should not return assignmentId or placementDepartment when worker does not exist', async () => {
    const mockFindWorkerById = persistenceLayer.findWorkerById as jest.MockedFunction<typeof findWorkerById>;
    mockFindWorkerById.mockResolvedValue({
      found: false,
      workerId: 'NONEXISTENT_WORKER_001',
      workerName: '',
      siteId: '',
      teamId: '',
      jobType: '',
      operatingStatus: '',
    });

    const input: FindInitialAssignmentByWorkerInput = {
      workerId: 'NONEXISTENT_WORKER_001',
      requestingUserId: 'valid_user_123',
    };

    try {
      await findInitialAssignmentByWorker(input);
      fail('Expected WorkerNotFound error to be thrown');
    } catch (error) {
      expect((error as Error).name).toBe('WorkerNotFound');
      expect(mockFindWorkerById).toHaveBeenCalledWith(
        expect.objectContaining({
          workerId: 'NONEXISTENT_WORKER_001',
          requestingUserId: 'valid_user_123',
        })
      );
    }
  });
});