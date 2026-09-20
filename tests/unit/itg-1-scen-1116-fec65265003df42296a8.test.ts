import { listWmsSyncLogByCondition, ListWmsSyncLogByConditionInput, ListWmsSyncLogByConditionOutput, GetWmsSyncLogByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-1116: WMS連携ログの検索条件付き取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検索条件を指定してWMS連携ログを取得すると、合致するログレコードの一覧と全件数が返される', async () => {
    const testLogs: GetWmsSyncLogByIdOutput[] = [
      {
        wmsSyncLogId: 'LOG001',
        syncType: '進捗データ取得',
        syncDirection: 'inbound',
        facilityId: 'FAC001',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T09:00:00Z',
        syncCompletedDateTime: '2024-01-15T09:05:00Z',
        processedItemCount: 50,
        successItemCount: 50,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'REQ001',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:05:00Z',
        createdBy: 'ADMIN',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'LOG002',
        syncType: '作業実績取得',
        syncDirection: 'inbound',
        facilityId: 'FAC001',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:03:00Z',
        processedItemCount: 30,
        successItemCount: 30,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'REQ002',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:03:00Z',
        createdBy: 'ADMIN',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'LOG003',
        syncType: '進捗データ取得',
        syncDirection: 'inbound',
        facilityId: 'FAC002',
        syncStatus: 'failure',
        syncStartDateTime: '2024-01-15T11:00:00Z',
        syncCompletedDateTime: '2024-01-15T11:05:00Z',
        processedItemCount: 0,
        successItemCount: 0,
        failureItemCount: 20,
        errorMessage: 'Connection timeout',
        retryCount: 2,
        wmsRequestId: 'REQ003',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:05:00Z',
        createdBy: 'ADMIN',
        updatedBy: null,
      },
    ];

    const input: ListWmsSyncLogByConditionInput = {
      facilityIds: ['FAC001'],
      syncStatuses: ['success'],
      syncStartFromDateTime: '2024-01-15T08:00:00Z',
      syncStartToDateTime: '2024-01-15T11:00:00Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListWmsSyncLogByConditionOutput = await listWmsSyncLogByCondition(input);

    expect(result.wmsSyncLogs).toHaveLength(2);
    
    expect(result.wmsSyncLogs[0].wmsSyncLogId).toBe('LOG001');
    expect(result.wmsSyncLogs[0].facilityId).toBe('FAC001');
    expect(result.wmsSyncLogs[0].syncStatus).toBe('success');
    expect(result.wmsSyncLogs[0].syncType).toBe('進捗データ取得');
    expect(result.wmsSyncLogs[0].syncDirection).toBe('inbound');
    expect(result.wmsSyncLogs[0].syncStartDateTime).toBe('2024-01-15T09:00:00Z');
    expect(result.wmsSyncLogs[0].syncCompletedDateTime).toBe('2024-01-15T09:05:00Z');
    expect(result.wmsSyncLogs[0].processedItemCount).toBe(50);
    expect(result.wmsSyncLogs[0].successItemCount).toBe(50);
    expect(result.wmsSyncLogs[0].failureItemCount).toBe(0);
    expect(result.wmsSyncLogs[0].retryCount).toBe(0);
    expect(result.wmsSyncLogs[0].wmsRequestId).toBe('REQ001');
    expect(result.wmsSyncLogs[0].createdAt).toBe('2024-01-15T09:00:00Z');
    expect(result.wmsSyncLogs[0].updatedAt).toBe('2024-01-15T09:05:00Z');
    expect(result.wmsSyncLogs[0].createdBy).toBe('ADMIN');

    expect(result.wmsSyncLogs[1].wmsSyncLogId).toBe('LOG002');
    expect(result.wmsSyncLogs[1].facilityId).toBe('FAC001');
    expect(result.wmsSyncLogs[1].syncStatus).toBe('success');
    expect(result.wmsSyncLogs[1].syncType).toBe('作業実績取得');
    expect(result.wmsSyncLogs[1].syncStartDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.wmsSyncLogs[1].syncCompletedDateTime).toBe('2024-01-15T10:03:00Z');
    expect(result.wmsSyncLogs[1].processedItemCount).toBe(30);
    expect(result.wmsSyncLogs[1].successItemCount).toBe(30);
    expect(result.wmsSyncLogs[1].failureItemCount).toBe(0);
    expect(result.wmsSyncLogs[1].retryCount).toBe(0);

    expect(result.totalCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate).toBeInstanceOf(Date);
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });
});