import { findWorkersByClassificationAndSite, FindWorkersByClassificationAndSiteInput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
}));

describe('SCEN-451: 稼働状況フィルターが指定されていない場合、全ての稼働状況の作業者が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all workers regardless of operating status when operatingStatusFilter is undefined', async () => {
    const input: FindWorkersByClassificationAndSiteInput = {
      jobType: 'JT001',
      siteId: 'SITE-A',
      operatingStatusFilter: undefined,
      requestingUserId: 'USER-123',
    };

    const mockWorkers = [
      {
        workerId: 'W001',
        workerName: 'Worker 1',
        siteId: 'SITE-A',
        teamId: 'TEAM-A',
        jobType: 'JT001',
        operatingStatus: 'active',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'W002',
        workerName: 'Worker 2',
        siteId: 'SITE-A',
        teamId: 'TEAM-A',
        jobType: 'JT001',
        operatingStatus: 'inactive',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'W003',
        workerName: 'Worker 3',
        siteId: 'SITE-A',
        teamId: 'TEAM-B',
        jobType: 'JT001',
        operatingStatus: 'suspended',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'W004',
        workerName: 'Worker 4',
        siteId: 'SITE-A',
        teamId: 'TEAM-B',
        jobType: 'JT001',
        operatingStatus: 'active',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'W005',
        workerName: 'Worker 5',
        siteId: 'SITE-A',
        teamId: 'TEAM-A',
        jobType: 'JT001',
        operatingStatus: 'inactive',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
    ];

    jest.spyOn(persistenceLayer, 'findWorkersByClassificationAndSite').mockResolvedValue({
      workers: mockWorkers,
      totalCount: 5,
      found: true,
    });

    const result = await findWorkersByClassificationAndSite(input);

    expect(result.found).toBe(true);
    expect(result.workers).toHaveLength(5);
    expect(result.totalCount).toBe(5);

    const operatingStatuses = new Set(result.workers.map(w => w.operatingStatus));
    expect(operatingStatuses).toContain('active');
    expect(operatingStatuses).toContain('inactive');
    expect(operatingStatuses).toContain('suspended');

    result.workers.forEach(worker => {
      expect(worker.siteId).toBe('SITE-A');
      expect(worker.jobType).toBe('JT001');
    });

    expect(persistenceLayer.findWorkersByClassificationAndSite).toHaveBeenCalledWith(input);
  });
});