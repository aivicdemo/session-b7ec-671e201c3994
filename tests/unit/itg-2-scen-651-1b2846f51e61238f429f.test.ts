import { findAllocationChangeHistoryByWorker } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as persistenceModule from '../../src/logic/persistence-layer';

describe('SCEN-651: findAllocationChangeHistoryByWorker - WorkerNotFoundError when worker does not exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFoundError when the specified worker ID does not exist', async () => {
    const nonExistentWorkerId = 'WORKER-999999';
    const validRequestingUserId = 'USER-001';

    const input = {
      workerId: nonExistentWorkerId,
      requestingUserId: validRequestingUserId,
    };

    jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValue(undefined);

    jest.spyOn(persistenceModule, 'findWorkerById').mockResolvedValue(null);

    await expect(findAllocationChangeHistoryByWorker(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'WorkerNotFoundError',
        message: '作業者が見つかりません。',
      })
    );
  });
});