import { jest } from '@jest/globals';
import { findWorkersByClassificationAndSite } from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/authorization-and-validation', () => ({
  validateInputData: jest.fn(),
  authorizeUserAction: jest.fn(),
}));

jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
  };
});

describe('SCEN-453: 指定された職務分類と拠点に該当する作業者レコードを検索', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検索条件に合致する作業者が存在する場合、found フラグが true に設定される', async () => {
    const { validateInputData, authorizeUserAction } = require('../../src/logic/authorization-and-validation');

    validateInputData.mockResolvedValue(undefined);
    authorizeUserAction.mockResolvedValue(true);

    const mockWorkers = [
      {
        workerId: 'W001',
        workerName: 'Worker One',
        siteId: 'SITE-A',
        teamId: 'TEAM-A',
        jobType: 'JT-001',
        operatingStatus: 'active',
        hourlyRate: 1000,
        maxOperatingHours: 8,
      },
      {
        workerId: 'W002',
        workerName: 'Worker Two',
        siteId: 'SITE-A',
        teamId: 'TEAM-A',
        jobType: 'JT-001',
        operatingStatus: 'active',
        hourlyRate: 1100,
        maxOperatingHours: 8,
      },
      {
        workerId: 'W003',
        workerName: 'Worker Three',
        siteId: 'SITE-A',
        teamId: 'TEAM-B',
        jobType: 'JT-001',
        operatingStatus: 'active',
        hourlyRate: 900,
        maxOperatingHours: 8,
      },
    ];

    jest.spyOn(require('../../src/logic/persistence-layer'), 'findWorkersByClassificationAndSite')
      .mockResolvedValueOnce({
        workers: mockWorkers,
        totalCount: 3,
        found: true,
      });

    const input = {
      jobType: 'JT-001',
      siteId: 'SITE-A',
      operatingStatusFilter: undefined,
      requestingUserId: 'USER-123',
    };

    const result = await findWorkersByClassificationAndSite(input);

    expect(validateInputData).toHaveBeenCalledWith(input);
    expect(authorizeUserAction).toHaveBeenCalledWith('USER-123', 'SITE-A');
    expect(result.found).toBe(true);
    expect(result.workers).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.workers[0]).toHaveProperty('workerId', 'W001');
    expect(result.workers[0]).toHaveProperty('workerName');
    expect(result.workers[0]).toHaveProperty('siteId', 'SITE-A');
    expect(result.workers[0]).toHaveProperty('teamId');
    expect(result.workers[0]).toHaveProperty('jobType', 'JT-001');
    expect(result.workers[0]).toHaveProperty('operatingStatus');
  });
});