import { findAllocationChangeHistoryByWorker, FindAllocationChangeHistoryByWorkerInput, FindAllocationChangeHistoryByWorkerOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-653: findAllocationChangeHistoryByWorker - No allocation change history found', () => {
  let authorizeUserActionSpy: jest.SpyInstance;
  let findWorkerByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    authorizeUserActionSpy = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);
    findWorkerByIdSpy = jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-id-no-history',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw NoAllocationChangeHistoryFoundError when no allocation change history exists for the worker', async () => {
    const workerId = 'worker-id-no-history';
    const requestingUserId = 'requesting-user-001';

    const input: FindAllocationChangeHistoryByWorkerInput = {
      workerId,
      requestingUserId,
    };

    let caughtError: Error | undefined;
    try {
      await findAllocationChangeHistoryByWorker(input);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('NoAllocationChangeHistoryFoundError');
    expect(caughtError?.message).toBe('割当変更履歴が見つかりません。');
    
    expect(authorizeUserActionSpy).toHaveBeenCalled();
    expect(findWorkerByIdSpy).toHaveBeenCalled();
  });

  it('should verify error structure matches FindAllocationChangeHistoryByWorkerOutput type', async () => {
    const workerId = 'worker-id-no-history';
    const requestingUserId = 'requesting-user-001';

    const input: FindAllocationChangeHistoryByWorkerInput = {
      workerId,
      requestingUserId,
    };

    let caughtError: any = undefined;
    try {
      await findAllocationChangeHistoryByWorker(input);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(typeof caughtError.name).toBe('string');
    expect(typeof caughtError.message).toBe('string');
    expect(caughtError.name).toEqual('NoAllocationChangeHistoryFoundError');
  });
});