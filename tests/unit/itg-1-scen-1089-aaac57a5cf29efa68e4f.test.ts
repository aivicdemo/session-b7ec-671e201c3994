import { listHandyTerminalSyncLogByCondition, ListHandyTerminalSyncLogByConditionInput, ListHandyTerminalSyncLogByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1089: ハンディターミナル連携ログ検索 - 合致するログが存在しない場合', () => {
  it('検索条件に合致するハンディターミナル連携ログが存在しない場合、警告が発生し空の結果が返される', async () => {
    // 検索条件を設定する：すべてのフィールドをデータベースに存在しない値で指定
    const searchCondition: ListHandyTerminalSyncLogByConditionInput = {
      handyTerminalSyncLogIds: ['nonexistent-log-id-001'],
      workerIds: ['nonexistent-worker-id-001'],
      handyTerminalIds: ['nonexistent-terminal-id-001'],
      facilityIds: ['nonexistent-facility-id-001'],
      syncTypes: ['nonexistent-sync-type'],
      syncStatuses: ['nonexistent-sync-status'],
      workInstructionIds: ['nonexistent-instruction-id-001'],
      sentDateFromDateTime: '2099-01-01T00:00:00Z',
      sentDateToDateTime: '2099-12-31T23:59:59Z',
      receivedDateFromDateTime: '2099-01-01T00:00:00Z',
      receivedDateToDateTime: '2099-12-31T23:59:59Z',
      processingCompletedDateFromDateTime: '2099-01-01T00:00:00Z',
      processingCompletedDateToDateTime: '2099-12-31T23:59:59Z',
      minRetryCount: 999,
      maxRetryCount: 1000,
      createdFromDate: '2099-01-01T00:00:00Z',
      createdToDate: '2099-12-31T23:59:59Z',
      updatedFromDate: '2099-01-01T00:00:00Z',
      updatedToDate: '2099-12-31T23:59:59Z',
      sortBy: 'sentDateTime',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 50,
    };

    // listHandyTerminalSyncLogByCondition()を呼び出す
    let caughtError: Error | undefined;
    let result: ListHandyTerminalSyncLogByConditionOutput | undefined;

    try {
      result = await listHandyTerminalSyncLogByCondition(searchCondition);
    } catch (error) {
      caughtError = error as Error;
    }

    // エラーが発生したか、または結果が返されたかを確認
    if (caughtError) {
      // 1. エラー名が'NoResultsFoundWarning'である
      expect(caughtError.name).toBe('NoResultsFoundWarning');

      // 2. エラーメッセージが「指定された条件に合致するハンディターミナル連携ログはありません。」である
      expect(caughtError.message).toBe('指定された条件に合致するハンディターミナル連携ログはありません。');
    } else {
      // 結果が出力型ListHandyTerminalSyncLogByConditionOutputであることを確認
      expect(result).toBeDefined();

      // 3. handyTerminalSyncLogsが空配列である
      expect(result!.handyTerminalSyncLogs).toEqual([]);

      // 4. totalCountが0である
      expect(result!.totalCount).toBe(0);

      // 5. retrievedAtがISO 8601形式の文字列である
      expect(result!.retrievedAt).toBeTruthy();
      expect(typeof result!.retrievedAt).toBe('string');
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(isoDateRegex.test(result!.retrievedAt)).toBe(true);

      // 6. pageNumberが指定した検索条件のpageNumberと一致する
      expect(result!.pageNumber).toBe(searchCondition.pageNumber);

      // 7. pageSizeが指定した検索条件のpageSizeと一致する
      expect(result!.pageSize).toBe(searchCondition.pageSize);
    }
  });

  it('検索条件にpageNumber、pageSizeが指定されない場合、それらがnull/undefinedで返される', async () => {
    const searchCondition: ListHandyTerminalSyncLogByConditionInput = {
      handyTerminalSyncLogIds: ['nonexistent-log-id-002'],
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
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    let caughtError: Error | undefined;
    let result: ListHandyTerminalSyncLogByConditionOutput | undefined;

    try {
      result = await listHandyTerminalSyncLogByCondition(searchCondition);
    } catch (error) {
      caughtError = error as Error;
    }

    if (caughtError) {
      // エラーが発生した場合、エラー名とメッセージを検証
      expect(caughtError.name).toBe('NoResultsFoundWarning');
      expect(caughtError.message).toBe('指定された条件に合致するハンディターミナル連携ログはありません。');
    } else {
      // 結果が出力型として返されることを確認
      expect(result).toBeDefined();
      expect(result!.handyTerminalSyncLogs).toEqual([]);
      expect(result!.totalCount).toBe(0);

      // pageNumberとpageSizeがnull/undefinedであることを確認
      expect(result!.pageNumber === null || result!.pageNumber === undefined).toBe(true);
      expect(result!.pageSize === null || result!.pageSize === undefined).toBe(true);

      // retrievedAtがISO 8601形式の文字列であることを確認
      expect(typeof result!.retrievedAt).toBe('string');
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(isoDateRegex.test(result!.retrievedAt)).toBe(true);
    }
  });
});