import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1118: WMS連携ログの検索条件エラー処理', () => {
  test('連携完了日時の開始が終了より後の場合、InvalidSearchConditionErrorが発生する', async () => {
    const input = {
      wmsSyncLogIds: undefined,
      syncTypes: undefined,
      syncDirections: undefined,
      facilityIds: undefined,
      syncStatuses: undefined,
      syncStartFromDateTime: undefined,
      syncStartToDateTime: undefined,
      syncCompletedFromDateTime: '2024-01-20T10:00:00Z',
      syncCompletedToDateTime: '2024-01-20T09:00:00Z',
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

    await expect(listWmsSyncLogByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: '検索条件が無効です。日時範囲またはページサイズを確認してください。',
      })
    );
  });
});