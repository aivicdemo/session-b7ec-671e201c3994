import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1083: ハンディターミナル連携ログ検索 - 日時範囲エラー', () => {
  it('更新日時の開始日時が終了日時より後の場合、InvalidSearchConditionError が発生する', async () => {
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
      updatedFromDate: '2024-12-31T23:59:59Z',
      updatedToDate: '2024-12-01T00:00:00Z',
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    try {
      await listHandyTerminalSyncLogByCondition(input);
      fail('InvalidSearchConditionError should be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).name).toBe('InvalidSearchConditionError');
      expect((error as any).message).toBe(
        '検索条件が無効です。日時範囲またはページネーション設定を確認してください。'
      );
    }
  });
});