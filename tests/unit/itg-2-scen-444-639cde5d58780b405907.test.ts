import { findWorkersByClassificationAndSite } from '../../src/logic/persistence-layer';

// Mock the persistence layer module
jest.mock('../../src/logic/persistence-layer');

describe('SCEN-444: 職務分類と拠点が有効で、該当する作業者が存在する場合、作業者一覧と件数が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return workers list and count when valid jobType and siteId with matching workers exist', async () => {
    const mockWorkers = [
      {
        workerId: 'WORKER-001',
        workerName: '作業者A',
        siteId: 'SITE-001',
        teamId: 'TEAM-001',
        jobType: 'JT001',
        operatingStatus: 'active',
        hourlyRate: 1200,
        maxOperatingHours: 8,
      },
      {
        workerId: 'WORKER-002',
        workerName: '作業者B',
        siteId: 'SITE-001',
        teamId: 'TEAM-001',
        jobType: 'JT001',
        operatingStatus: 'active',
        hourlyRate: 1300,
        maxOperatingHours: 8,
      },
      {
        workerId: 'WORKER-003',
        workerName: '作業者C',
        siteId: 'SITE-001',
        teamId: 'TEAM-002',
        jobType: 'JT001',
        operatingStatus: 'active',
        hourlyRate: 1100,
        maxOperatingHours: 8,
      },
    ];

    const input = {
      jobType: 'JT001',
      siteId: 'SITE-001',
      operatingStatusFilter: undefined,
      requestingUserId: 'USER-123',
    };

    // スタブ authorizeUserAction が権限チェックを成功させるよう設定する（USER-123 が SITE-001 へのアクセス権限を持つ状態）
    // スタブ validateInputData が入力値の妥当性チェックを成功させるよう設定する（jobType と siteId が有効形式）
    // 永続化層が3件の作業者レコードを返すよう設定する
    (findWorkersByClassificationAndSite as jest.Mock).mockResolvedValue({
      workers: mockWorkers,
      totalCount: 3,
      found: true,
    });

    const result = await findWorkersByClassificationAndSite(input);

    expect(result.workers).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.found).toBe(true);

    result.workers.forEach((worker) => {
      expect(worker.jobType).toBe('JT001');
      expect(worker.siteId).toBe('SITE-001');
    });

    expect(result.workers[0].workerId).toBe('WORKER-001');
    expect(result.workers[0].workerName).toBe('作業者A');
    expect(result.workers[1].workerId).toBe('WORKER-002');
    expect(result.workers[1].workerName).toBe('作業者B');
    expect(result.workers[2].workerId).toBe('WORKER-003');
    expect(result.workers[2].workerName).toBe('作業者C');

    // 呼び出しが正しく実行されたか確認
    expect(findWorkersByClassificationAndSite).toHaveBeenCalledWith(input);
    expect(findWorkersByClassificationAndSite).toHaveBeenCalledTimes(1);
  });
});