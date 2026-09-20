import { renderProductivityDashboard } from '../../src/logic/productivity-dashboard-presentation';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-367: renderProductivityDashboard - WorkerNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkerNotFoundError when worker does not exist', async () => {
    const nonexistentWorkerId = 'WORKER_NONEXISTENT_12345';
    const validUserId = 'USER_VALID_123';

    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue(null);

    let thrownError: any;
    try {
      await renderProductivityDashboard({
        workerId: nonexistentWorkerId,
        userId: validUserId,
      });
      fail('Expected WorkerNotFoundError to be thrown');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.constructor.name).toBe('WorkerNotFoundError');
    expect(thrownError.message).toBe('作業者が見つかりません。');
  });
});