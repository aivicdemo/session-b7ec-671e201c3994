import { findProductivityDataByWorkerAndPeriod } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-468: 指定された作業者IDが存在しない場合、WorkerNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(undefined);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw WorkerNotFoundError when worker does not exist', async () => {
    const nonExistentWorkerId = 'non-existent-worker-id';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'valid-user-id';

    let thrownError: Error | undefined;
    try {
      await findProductivityDataByWorkerAndPeriod({
        workerId: nonExistentWorkerId,
        startDate,
        endDate,
        requestingUserId,
      });
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.constructor.name).toBe('WorkerNotFoundError');
    expect(thrownError?.message).toBe('作業者が見つかりません。');
  });
});