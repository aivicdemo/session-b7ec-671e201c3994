import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';
import { GetWmsSyncLogByIdOutput, ListWmsSyncLogByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1125: WMS連携ログ一覧取得（ページネーション指定時）', () => {
  let testData: GetWmsSyncLogByIdOutput[] = [];

  beforeAll(() => {
    testData = Array.from({ length: 30 }, (_, index) => ({
      wmsSyncLogId: `wms-sync-log-${index + 1}`,
      syncType: index % 3 === 0 ? '進捗データ取得' : index % 3 === 1 ? '作業実績同期' : '在庫同期',
      syncDirection: index % 2 === 0 ? 'inbound' : 'outbound',
      facilityId: `facility-${(index % 5) + 1}`,
      syncStatus: index < 10 ? 'success' : index < 20 ? 'failure' : 'pending',
      syncStartDateTime: new Date(2024, 0, index + 1).toISOString(),
      syncCompletedDateTime: index < 20 ? new Date(2024, 0, index + 1, 1, 0, 0).toISOString() : null,
      processedItemCount: 100 + index * 10,
      successItemCount: 90 + index * 10,
      failureItemCount: 10,
      errorMessage: index >= 20 ? `Error on record ${index + 1}` : null,
      retryCount: index >= 20 ? 2 : null,
      wmsRequestId: `wms-req-${index + 1}`,
      createdAt: new Date(2024, 0, index + 1).toISOString(),
      updatedAt: new Date(2024, 0, index + 1).toISOString(),
      createdBy: 'user-001',
      updatedBy: 'user-001'
    }));
  });

  it('ページ2のレコード（11～20番目）を正しく取得する', async () => {
    const input = {
      wmsSyncLogIds: undefined,
      syncTypes: undefined,
      syncDirections: undefined,
      facilityIds: undefined,
      syncStatuses: undefined,
      syncStartFromDateTime: undefined,
      syncStartToDateTime: undefined,
      syncCompletedFromDateTime: undefined,
      syncCompletedToDateTime: undefined,
      minProcessedItemCount: undefined,
      maxProcessedItemCount: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      wmsRequestIds: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 2,
      pageSize: 10
    };

    const result: ListWmsSyncLogByConditionOutput = await listWmsSyncLogByCondition(input);

    expect(result.wmsSyncLogs).toHaveLength(10);
    expect(result.totalCount).toBe(30);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.wmsSyncLogs[0].wmsSyncLogId).toBe('wms-sync-log-11');
    expect(result.wmsSyncLogs[9].wmsSyncLogId).toBe('wms-sync-log-20');
  });
});