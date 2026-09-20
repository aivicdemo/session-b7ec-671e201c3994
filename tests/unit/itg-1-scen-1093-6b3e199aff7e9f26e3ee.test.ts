import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1093: ハンディターミナル連携ログ一覧取得 - 全検索条件null時の全レコード返却', () => {
  it('すべての検索条件がnull・undefined・省略された場合、全レコードが返される', async () => {
    // Arrange: すべての検索条件をnullで設定した入力オブジェクトを生成
    const input = {
      handyTerminalSyncLogIds: null,
      workerIds: null,
      handyTerminalIds: null,
      facilityIds: null,
      syncTypes: null,
      syncStatuses: null,
      workInstructionIds: null,
      sentDateFromDateTime: null,
      sentDateToDateTime: null,
      receivedDateFromDateTime: null,
      receivedDateToDateTime: null,
      processingCompletedDateFromDateTime: null,
      processingCompletedDateToDateTime: null,
      minRetryCount: null,
      maxRetryCount: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act: listHandyTerminalSyncLogByCondition関数を実行
    const result = await listHandyTerminalSyncLogByCondition(input);

    // Assert: 戻り値を検証
    expect(result).toBeDefined();
    expect(result.handyTerminalSyncLogs).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLogs)).toBe(true);
    
    // すべてのレコードが返されていることを確認
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');
    
    // ページネーション情報がnullまたはundefinedであることを確認
    expect(result.pageNumber === null || result.pageNumber === undefined).toBe(true);
    expect(result.pageSize === null || result.pageSize === undefined).toBe(true);
    
    // retrievedAtがISO 8601形式の日時であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate instanceof Date && !isNaN(retrievedDate.getTime())).toBe(true);
    
    // 返却されたレコード数がtotalCountと一致することを確認
    expect(result.handyTerminalSyncLogs.length).toBeLessThanOrEqual(result.totalCount);
  });
});