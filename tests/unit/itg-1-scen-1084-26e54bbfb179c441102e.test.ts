import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1084: ハンディターミナル連携ログ検索 - ページサイズ無効値エラー', () => {
  it('ページサイズが1未満の場合、InvalidSearchConditionErrorが発生する', async () => {
    const input = {
      pageSize: 0,
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
    };

    await expect(listHandyTerminalSyncLogByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: '検索条件が無効です。日時範囲またはページネーション設定を確認してください。',
      })
    );
  });
});