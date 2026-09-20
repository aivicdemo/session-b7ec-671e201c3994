import { listWorkersByCondition, saveWorker } from '../../src/logic/data-persistence';

describe('SCEN-626: ページネーション指定時に最後のページで残り件数がpageSizeより少ない場合', () => {
  it('最後のページで残り件数が返される', async () => {
    // テストデータの準備：データベースに23件の作業者レコードを挿入
    const testWorkers = Array.from({ length: 23 }, (_, i) => ({
      workerId: null,
      workerName: `作業者${i + 1}`,
      facilityId: 'facility-1',
      teamId: 'team-1',
      jobType: 'job-type-1',
      operatingStatus: 'active',
      hourlyRate: 1000 + i * 50,
      maxWorkingHours: 8,
      createdBy: 'user-1',
      updatedBy: undefined,
    }));

    // 前提処理：テストデータをデータベースに投入
    for (const workerInput of testWorkers) {
      await saveWorker(workerInput);
    }

    // 入力パラメータの設定：pageNumber=3、pageSize=10、その他の検索条件はnull
    const input = {
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
      operatingStatuses: null,
      minHourlyRate: null,
      maxHourlyRate: null,
      minMaxWorkingHours: null,
      maxMaxWorkingHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 3,
      pageSize: 10,
    };

    // 操作の呼び出し：実装の listWorkersByCondition 関数を直接呼び出す
    const result = await listWorkersByCondition(input);

    // 期待結果の検証
    // workers配列の要素数が3であることを確認（最後のページなので残り3件）
    expect(result.workers).toHaveLength(3);

    // totalCountが23であることを確認
    expect(result.totalCount).toBe(23);

    // pageNumberが3であることを確認
    expect(result.pageNumber).toBe(3);

    // pageSizeが10であることを確認
    expect(result.pageSize).toBe(10);

    // retrievedAtがISO 8601形式のタイムスタンプであることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 各作業者レコードがGetWorkerByIdOutputスキーマに準拠していることを確認
    result.workers.forEach((worker) => {
      expect(worker).toHaveProperty('workerId');
      expect(worker).toHaveProperty('workerName');
      expect(worker).toHaveProperty('facilityId');
      expect(worker).toHaveProperty('teamId');
      expect(worker).toHaveProperty('jobType');
      expect(worker).toHaveProperty('operatingStatus');
      expect(worker).toHaveProperty('createdAt');
      expect(worker).toHaveProperty('updatedAt');
      expect(worker).toHaveProperty('createdBy');
      expect(typeof worker.workerId).toBe('string');
      expect(typeof worker.workerName).toBe('string');
      expect(typeof worker.facilityId).toBe('string');
      expect(typeof worker.teamId).toBe('string');
      expect(typeof worker.jobType).toBe('string');
      expect(typeof worker.operatingStatus).toBe('string');
      expect(typeof worker.createdAt).toBe('string');
      expect(typeof worker.updatedAt).toBe('string');
      expect(typeof worker.createdBy).toBe('string');
    });

    // 返されたデータが3ページ目（最後のページ）のデータであることを確認
    // ページサイズが10なので、1-10件が1ページ、11-20件が2ページ、21-23件が3ページ
    const actualWorkerNames = result.workers.map((w) => w.workerName);
    expect(actualWorkerNames).toEqual(['作業者21', '作業者22', '作業者23']);
  });
});