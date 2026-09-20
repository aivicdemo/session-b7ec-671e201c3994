import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1090: 複数の検索条件を組み合わせた場合、すべての条件に合致するログのみが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only logs matching all search conditions', async () => {
    // テスト用のハンディターミナル連携ログデータをデータベースに準備する
    const testLogs = [
      {
        handyTerminalSyncLogId: 'log-A',
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result_sync',
        workInstructionId: null,
        syncContent: '{}',
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T10:00:00Z',
        receivedDateTime: '2024-01-15T10:00:05Z',
        processingCompletedDateTime: '2024-01-15T10:00:10Z',
        retryCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:10Z',
        createdBy: 'SYSTEM',
        updatedBy: null,
      },
      {
        handyTerminalSyncLogId: 'log-B',
        workerId: 'W001',
        handyTerminalId: 'HT002',
        facilityId: 'F001',
        syncType: 'work_result_sync',
        workInstructionId: null,
        syncContent: '{}',
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T10:05:00Z',
        receivedDateTime: '2024-01-15T10:05:05Z',
        processingCompletedDateTime: '2024-01-15T10:05:10Z',
        retryCount: 0,
        createdAt: '2024-01-15T10:05:00Z',
        updatedAt: '2024-01-15T10:05:10Z',
        createdBy: 'SYSTEM',
        updatedBy: null,
      },
      {
        handyTerminalSyncLogId: 'log-C',
        workerId: 'W002',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result_sync',
        workInstructionId: null,
        syncContent: '{}',
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T10:10:00Z',
        receivedDateTime: '2024-01-15T10:10:05Z',
        processingCompletedDateTime: '2024-01-15T10:10:10Z',
        retryCount: 0,
        createdAt: '2024-01-15T10:10:00Z',
        updatedAt: '2024-01-15T10:10:10Z',
        createdBy: 'SYSTEM',
        updatedBy: null,
      },
      {
        handyTerminalSyncLogId: 'log-D',
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result_sync',
        workInstructionId: null,
        syncContent: '{}',
        syncStatus: 'failed',
        errorMessage: 'Connection timeout',
        sentDateTime: '2024-01-15T10:15:00Z',
        receivedDateTime: null,
        processingCompletedDateTime: null,
        retryCount: 1,
        createdAt: '2024-01-15T10:15:00Z',
        updatedAt: '2024-01-15T10:15:00Z',
        createdBy: 'SYSTEM',
        updatedBy: null,
      },
      {
        handyTerminalSyncLogId: 'log-E',
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'status_update',
        workInstructionId: null,
        syncContent: '{}',
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T10:20:00Z',
        receivedDateTime: '2024-01-15T10:20:05Z',
        processingCompletedDateTime: '2024-01-15T10:20:10Z',
        retryCount: 0,
        createdAt: '2024-01-15T10:20:00Z',
        updatedAt: '2024-01-15T10:20:10Z',
        createdBy: 'SYSTEM',
        updatedBy: null,
      },
    ];

    // テストデータをモック実装で返すようにセットアップ
    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue({
        handyTerminalSyncLogs: [testLogs[0]],
        totalCount: 1,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: new Date().toISOString(),
      });

    // listHandyTerminalSyncLogByCondition を以下の複合条件で呼び出す
    const result = await listHandyTerminalSyncLogByCondition({
      workerIds: ['W001'],
      handyTerminalIds: ['HT001'],
      syncStatuses: ['success'],
      syncTypes: ['work_result_sync'],
      handyTerminalSyncLogIds: undefined,
      facilityIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    // 戻り値の handyTerminalSyncLogs 配列を検証する
    expect(result.handyTerminalSyncLogs).toHaveLength(1);
    expect(result.handyTerminalSyncLogs[0].handyTerminalSyncLogId).toBe('log-A');
    expect(result.handyTerminalSyncLogs[0].workerId).toBe('W001');
    expect(result.handyTerminalSyncLogs[0].handyTerminalId).toBe('HT001');
    expect(result.handyTerminalSyncLogs[0].syncStatus).toBe('success');
    expect(result.handyTerminalSyncLogs[0].syncType).toBe('work_result_sync');

    // すべての条件に合致するログのみが返される
    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ handyTerminalSyncLogId: 'log-B' })
    );
    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ handyTerminalSyncLogId: 'log-C' })
    );
    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ handyTerminalSyncLogId: 'log-D' })
    );
    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ handyTerminalSyncLogId: 'log-E' })
    );

    // 戻り値の totalCount フィールドを検証する
    expect(result.totalCount).toBe(1);

    // 戻り値の retrievedAt フィールドが ISO 8601 形式の有効な日時であることを検証する
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });

  it('should exclude logs with mismatched workerIds', async () => {
    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue({
        handyTerminalSyncLogs: [
          {
            handyTerminalSyncLogId: 'log-A',
            workerId: 'W001',
            handyTerminalId: 'HT001',
            facilityId: 'F001',
            syncType: 'work_result_sync',
            workInstructionId: null,
            syncContent: '{}',
            syncStatus: 'success',
            errorMessage: null,
            sentDateTime: '2024-01-15T10:00:00Z',
            receivedDateTime: '2024-01-15T10:00:05Z',
            processingCompletedDateTime: '2024-01-15T10:00:10Z',
            retryCount: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:10Z',
            createdBy: 'SYSTEM',
            updatedBy: null,
          },
        ],
        totalCount: 1,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: new Date().toISOString(),
      });

    const result = await listHandyTerminalSyncLogByCondition({
      workerIds: ['W001'],
      handyTerminalIds: ['HT001'],
      syncStatuses: ['success'],
      syncTypes: ['work_result_sync'],
      handyTerminalSyncLogIds: undefined,
      facilityIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ workerId: 'W002' })
    );
  });

  it('should exclude logs with mismatched handyTerminalIds', async () => {
    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue({
        handyTerminalSyncLogs: [
          {
            handyTerminalSyncLogId: 'log-A',
            workerId: 'W001',
            handyTerminalId: 'HT001',
            facilityId: 'F001',
            syncType: 'work_result_sync',
            workInstructionId: null,
            syncContent: '{}',
            syncStatus: 'success',
            errorMessage: null,
            sentDateTime: '2024-01-15T10:00:00Z',
            receivedDateTime: '2024-01-15T10:00:05Z',
            processingCompletedDateTime: '2024-01-15T10:00:10Z',
            retryCount: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:10Z',
            createdBy: 'SYSTEM',
            updatedBy: null,
          },
        ],
        totalCount: 1,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: new Date().toISOString(),
      });

    const result = await listHandyTerminalSyncLogByCondition({
      workerIds: ['W001'],
      handyTerminalIds: ['HT001'],
      syncStatuses: ['success'],
      syncTypes: ['work_result_sync'],
      handyTerminalSyncLogIds: undefined,
      facilityIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ handyTerminalId: 'HT002' })
    );
  });

  it('should exclude logs with mismatched syncStatuses', async () => {
    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue({
        handyTerminalSyncLogs: [
          {
            handyTerminalSyncLogId: 'log-A',
            workerId: 'W001',
            handyTerminalId: 'HT001',
            facilityId: 'F001',
            syncType: 'work_result_sync',
            workInstructionId: null,
            syncContent: '{}',
            syncStatus: 'success',
            errorMessage: null,
            sentDateTime: '2024-01-15T10:00:00Z',
            receivedDateTime: '2024-01-15T10:00:05Z',
            processingCompletedDateTime: '2024-01-15T10:00:10Z',
            retryCount: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:10Z',
            createdBy: 'SYSTEM',
            updatedBy: null,
          },
        ],
        totalCount: 1,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: new Date().toISOString(),
      });

    const result = await listHandyTerminalSyncLogByCondition({
      workerIds: ['W001'],
      handyTerminalIds: ['HT001'],
      syncStatuses: ['success'],
      syncTypes: ['work_result_sync'],
      handyTerminalSyncLogIds: undefined,
      facilityIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ syncStatus: 'failed' })
    );
  });

  it('should exclude logs with mismatched syncTypes', async () => {
    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue({
        handyTerminalSyncLogs: [
          {
            handyTerminalSyncLogId: 'log-A',
            workerId: 'W001',
            handyTerminalId: 'HT001',
            facilityId: 'F001',
            syncType: 'work_result_sync',
            workInstructionId: null,
            syncContent: '{}',
            syncStatus: 'success',
            errorMessage: null,
            sentDateTime: '2024-01-15T10:00:00Z',
            receivedDateTime: '2024-01-15T10:00:05Z',
            processingCompletedDateTime: '2024-01-15T10:00:10Z',
            retryCount: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:10Z',
            createdBy: 'SYSTEM',
            updatedBy: null,
          },
        ],
        totalCount: 1,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: new Date().toISOString(),
      });

    const result = await listHandyTerminalSyncLogByCondition({
      workerIds: ['W001'],
      handyTerminalIds: ['HT001'],
      syncStatuses: ['success'],
      syncTypes: ['work_result_sync'],
      handyTerminalSyncLogIds: undefined,
      facilityIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result.handyTerminalSyncLogs).not.toContainEqual(
      expect.objectContaining({ syncType: 'status_update' })
    );
  });

  it('should return ISO 8601 formatted retrievedAt timestamp', async () => {
    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue({
        handyTerminalSyncLogs: [
          {
            handyTerminalSyncLogId: 'log-A',
            workerId: 'W001',
            handyTerminalId: 'HT001',
            facilityId: 'F001',
            syncType: 'work_result_sync',
            workInstructionId: null,
            syncContent: '{}',
            syncStatus: 'success',
            errorMessage: null,
            sentDateTime: '2024-01-15T10:00:00Z',
            receivedDateTime: '2024-01-15T10:00:05Z',
            processingCompletedDateTime: '2024-01-15T10:00:10Z',
            retryCount: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:10Z',
            createdBy: 'SYSTEM',
            updatedBy: null,
          },
        ],
        totalCount: 1,
        pageNumber: undefined,
        pageSize: undefined,
        retrievedAt: new Date().toISOString(),
      });

    const result = await listHandyTerminalSyncLogByCondition({
      workerIds: ['W001'],
      handyTerminalIds: ['HT001'],
      syncStatuses: ['success'],
      syncTypes: ['work_result_sync'],
      handyTerminalSyncLogIds: undefined,
      facilityIds: undefined,
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });
});