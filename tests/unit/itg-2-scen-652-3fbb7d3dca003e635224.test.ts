import { findAllocationChangeHistoryByWorker } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-652: findAllocationChangeHistoryByWorker - UnauthorizedAccessError when user lacks access rights', () => {
  let authorizeUserActionSpy: jest.SpyInstance;
  let findWorkerByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    authorizeUserActionSpy = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(false);
    findWorkerByIdSpy = jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      siteId: 'S001',
      teamId: 'T001',
      jobType: 'Assembly',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxOperatingHours: 8,
      found: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw UnauthorizedAccessError when requestingUserId has no access rights to allocation change history', async () => {
    const input = {
      workerId: 'W001',
      requestingUserId: 'U999',
    };

    await expect(findAllocationChangeHistoryByWorker(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'UnauthorizedAccessError',
        message: expect.stringContaining('割当変更履歴へのアクセス権限がありません。'),
      })
    );

    expect(authorizeUserActionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingUserId: 'U999',
        resourceType: 'allocationChangeHistory',
      })
    );
  });
});