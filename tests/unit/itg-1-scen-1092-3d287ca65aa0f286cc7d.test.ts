import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1092: ソート指定時に、指定フィールド・順序でソートされたレコードが返される', () => {
  const testData = [
    {
      handyTerminalSyncLogId: 'log-001',
      workerId: 'worker-001',
      handyTerminalId: 'terminal-001',
      facilityId: 'facility-001',
      syncType: 'work_result',
      workInstructionId: 'instr-001',
      syncContent: JSON.stringify({ quantity: 10 }),
      syncStatus: 'success',
      errorMessage: null,
      sentDateTime: '2024-01-15T10:00:00Z',
      receivedDateTime: '2024-01-15T10:01:00Z',
      processingCompletedDateTime: '2024-01-15T10:02:00Z',
      retryCount: 0,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: 'system',
      updatedBy: null,
    },
    {
      handyTerminalSyncLogId: 'log-002',
      workerId: 'worker-002',
      handyTerminalId: 'terminal-002',
      facilityId: 'facility-001',
      syncType: 'status_update',
      workInstructionId: 'instr-002',
      syncContent: JSON.stringify({ status: 'in_progress' }),
      syncStatus: 'pending',
      errorMessage: null,
      sentDateTime: '2024-01-15T08:30:00Z',
      receivedDateTime: '2024-01-15T08:31:00Z',
      processingCompletedDateTime: null,
      retryCount: 1,
      createdAt: '2024-01-15T08:30:00Z',
      updatedAt: '2024-01-15T08:30:00Z',
      createdBy: 'system',
      updatedBy: null,
    },
    {
      handyTerminalSyncLogId: 'log-003',
      workerId: 'worker-003',
      handyTerminalId: 'terminal-003',
      facilityId: 'facility-002',
      syncType: 'position_update',
      workInstructionId: 'instr-003',
      syncContent: JSON.stringify({ latitude: 35.6762, longitude: 139.6503 }),
      syncStatus: 'failure',
      errorMessage: 'Connection timeout',
      sentDateTime: '2024-01-15T09:15:00Z',
      receivedDateTime: null,
      processingCompletedDateTime: null,
      retryCount: 2,
      createdAt: '2024-01-15T09:15:00Z',
      updatedAt: '2024-01-15T09:15:00Z',
      createdBy: 'system',
      updatedBy: null,
    },
  ];

  beforeAll(async () => {
    // テストデータをデータベースに登録
    for (const data of testData) {
      // 実際のDB登録処理を呼び出す
      // 例：await saveHandyTerminalSyncLog(data);
      // ここではスタブ/モック化を想定
    }
  });

  afterAll(async () => {
    // テスト後のクリーンアップ処理
    // 登録したテストデータを削除
  });

  it('昇順（asc）でソートされたレコードを返す', async () => {
    const result = await listHandyTerminalSyncLogByCondition({
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'sentDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.handyTerminalSyncLogs.length).toBeGreaterThanOrEqual(3);

    const sentDateTimes = result.handyTerminalSyncLogs.map((log) => log.sentDateTime);

    for (let i = 0; i < sentDateTimes.length - 1; i++) {
      const current = new Date(sentDateTimes[i]).getTime();
      const next = new Date(sentDateTimes[i + 1]).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('降順（desc）でソートされたレコードを返す', async () => {
    const result = await listHandyTerminalSyncLogByCondition({
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'sentDateTime',
      sortOrder: 'desc',
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.handyTerminalSyncLogs.length).toBeGreaterThanOrEqual(3);

    const sentDateTimes = result.handyTerminalSyncLogs.map((log) => log.sentDateTime);

    for (let i = 0; i < sentDateTimes.length - 1; i++) {
      const current = new Date(sentDateTimes[i]).getTime();
      const next = new Date(sentDateTimes[i + 1]).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('昇順でソート、syncStatusフィールドで並び替える', async () => {
    const result = await listHandyTerminalSyncLogByCondition({
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'syncStatus',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.handyTerminalSyncLogs.length).toBeGreaterThanOrEqual(3);

    const syncStatuses = result.handyTerminalSyncLogs.map((log) => log.syncStatus);

    for (let i = 0; i < syncStatuses.length - 1; i++) {
      expect(syncStatuses[i].localeCompare(syncStatuses[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  it('降順でソート、retryCountフィールドで並び替える', async () => {
    const result = await listHandyTerminalSyncLogByCondition({
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'retryCount',
      sortOrder: 'desc',
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.handyTerminalSyncLogs.length).toBeGreaterThanOrEqual(3);

    const retryCounts = result.handyTerminalSyncLogs.map((log) => log.retryCount);

    for (let i = 0; i < retryCounts.length - 1; i++) {
      expect(retryCounts[i]).toBeGreaterThanOrEqual(retryCounts[i + 1]);
    }
  });

  it('検索条件を指定した場合、合致するレコードのみソートして返す', async () => {
    const result = await listHandyTerminalSyncLogByCondition({
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: ['success', 'pending'],
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'sentDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.handyTerminalSyncLogs.length).toBeGreaterThanOrEqual(2);

    for (const log of result.handyTerminalSyncLogs) {
      expect(['success', 'pending']).toContain(log.syncStatus);
    }

    const sentDateTimes = result.handyTerminalSyncLogs.map((log) => log.sentDateTime);
    for (let i = 0; i < sentDateTimes.length - 1; i++) {
      const current = new Date(sentDateTimes[i]).getTime();
      const next = new Date(sentDateTimes[i + 1]).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it('retrievedAtがISO 8601形式で返される', async () => {
    const result = await listHandyTerminalSyncLogByCondition({
      handyTerminalSyncLogIds: undefined,
      workerIds: undefined,
      handyTerminalIds: undefined,
      facilityIds: undefined,
      syncTypes: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      sentDateFromDateTime: undefined,
      sentDateToDateTime: undefined,
      receivedDateFromDateTime: undefined,
      receivedDateToDateTime: undefined,
      processingCompletedDateFromDateTime: undefined,
      processingCompletedDateToDateTime: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: 'sentDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 10,
    });

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });
});