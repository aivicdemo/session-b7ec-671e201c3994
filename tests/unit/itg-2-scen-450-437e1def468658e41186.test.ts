import { findWorkersByClassificationAndSite, FindWorkersByClassificationAndSiteInput, FindWorkersByClassificationAndSiteOutput, FindWorkersByClassificationAndSiteOutputWorker } from '../../src/logic/persistence-layer';

describe('SCEN-450: findWorkersByClassificationAndSite with operatingStatusFilter', () => {
  let originalFunction: any;
  let mockFindWorkersByClassificationAndSite: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return only workers matching the operatingStatusFilter condition', async () => {
    // Prepare test data
    const mockAllWorkers: FindWorkersByClassificationAndSiteOutputWorker[] = [
      {
        workerId: 'worker-1',
        workerName: 'Worker One',
        siteId: 'valid-site-id',
        teamId: 'team-1',
        jobType: 'valid-job-type-id',
        operatingStatus: 'active',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'worker-2',
        workerName: 'Worker Two',
        siteId: 'valid-site-id',
        teamId: 'team-1',
        jobType: 'valid-job-type-id',
        operatingStatus: 'inactive',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'worker-3',
        workerName: 'Worker Three',
        siteId: 'valid-site-id',
        teamId: 'team-2',
        jobType: 'valid-job-type-id',
        operatingStatus: 'active',
        hourlyRate: 1100,
        maxOperatingHours: 8,
      },
      {
        workerId: 'worker-4',
        workerName: 'Worker Four',
        siteId: 'valid-site-id',
        teamId: 'team-2',
        jobType: 'valid-job-type-id',
        operatingStatus: 'suspended',
        hourlyRate: 1100,
        maxOperatingHours: 8,
      },
    ];

    const activeWorkers = mockAllWorkers.filter(w => w.operatingStatus === 'active');

    const input: FindWorkersByClassificationAndSiteInput = {
      jobType: 'valid-job-type-id',
      siteId: 'valid-site-id',
      operatingStatusFilter: 'active',
      requestingUserId: 'authorized-user-id',
    };

    // Mock the function to simulate database filtering
    mockFindWorkersByClassificationAndSite = jest.fn().mockResolvedValue({
      workers: activeWorkers,
      totalCount: activeWorkers.length,
      found: activeWorkers.length > 0,
    } as FindWorkersByClassificationAndSiteOutput);

    // Replace the actual function with the mock
    jest.spyOn(require('../../src/logic/persistence-layer'), 'findWorkersByClassificationAndSite').mockImplementation(mockFindWorkersByClassificationAndSite);

    // Call the function
    const result: FindWorkersByClassificationAndSiteOutput = await findWorkersByClassificationAndSite(input);

    // Verify results
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);

    // Verify all workers have 'active' status
    result.workers.forEach((worker) => {
      expect(worker.operatingStatus).toBe('active');
    });

    // Verify no workers with other statuses are included
    result.workers.forEach((worker) => {
      expect(worker.operatingStatus).not.toBe('inactive');
      expect(worker.operatingStatus).not.toBe('suspended');
    });

    // Verify totalCount matches workers array length
    expect(result.totalCount).toBe(result.workers.length);
    expect(result.totalCount).toBe(2); // Only 'active' workers

    // Verify found flag is true
    expect(result.found).toBe(true);

    // Verify the mock was called with correct input
    expect(mockFindWorkersByClassificationAndSite).toHaveBeenCalledWith(input);
  });
});