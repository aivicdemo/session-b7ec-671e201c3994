import { ListWmsSyncLogByConditionInput, ListWmsSyncLogByConditionOutput } from '../../src/logic/data-persistence';
import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1127: WMS連携ログ検索 - 全検索条件未指定時の全レコード取得', () => {
  it('すべての検索条件が未指定の場合、保存されている全WMS連携ログが返される', async () => {
    // 事前に全レコード数を確認するため、条件なしで一度取得
    const preCheckInput: ListWmsSyncLogByConditionInput = {
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
      pageNumber: undefined,
      pageSize: undefined,
    };

    const output: ListWmsSyncLogByConditionOutput = await listWmsSyncLogByCondition(preCheckInput);

    expect(output).toBeDefined();
    expect(output.wmsSyncLogs).toBeDefined();
    expect(Array.isArray(output.wmsSyncLogs)).toBe(true);
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    
    // 仕様: ページネーション未指定時は全件返却
    expect(output.wmsSyncLogs.length).toBe(output.totalCount);
    
    // 仕様: pageNumberとpageSizeは未設定状態（null または undefined）
    expect(output.pageNumber === null || output.pageNumber === undefined).toBe(true);
    expect(output.pageSize === null || output.pageSize === undefined).toBe(true);
    
    // 仕様: retrievedAtが現在時刻（ISO 8601形式）で設定される
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
    const retrievedDate = new Date(output.retrievedAt);
    expect(retrievedDate.toString()).not.toBe('Invalid Date');
    
    // 仕様: データベースに保存されているすべてのWMS連携ログレコードが含まれていることを確認
    if (output.totalCount > 0) {
      expect(output.wmsSyncLogs.length).toBeGreaterThan(0);
      output.wmsSyncLogs.forEach(log => {
        expect(log.wmsSyncLogId).toBeDefined();
        expect(typeof log.wmsSyncLogId).toBe('string');
        expect(log.syncType).toBeDefined();
        expect(log.syncDirection).toBeDefined();
        expect(log.facilityId).toBeDefined();
        expect(log.syncStatus).toBeDefined();
        expect(log.syncStartDateTime).toBeDefined();
        expect(log.processedItemCount).toBeDefined();
        expect(typeof log.processedItemCount).toBe('number');
        expect(log.successItemCount).toBeDefined();
        expect(typeof log.successItemCount).toBe('number');
        expect(log.failureItemCount).toBeDefined();
        expect(typeof log.failureItemCount).toBe('number');
      });
    }
  });
});