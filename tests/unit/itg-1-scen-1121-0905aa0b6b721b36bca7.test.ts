import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1121: WMS連携ログ検索 - 更新日時範囲逆順エラー', () => {
  it('レコード更新日の開始が終了より後の場合、InvalidSearchConditionError が発生する', async () => {
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
      updatedFromDate: '2024-01-20T10:00:00Z',
      updatedToDate: '2024-01-20T09:00:00Z',
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    try {
      await listWmsSyncLogByCondition(input);
      fail('InvalidSearchConditionError が発生すると予期されていました');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('InvalidSearchConditionError');
      expect((error as Error).message).toBe('検索条件が無効です。日時範囲またはページサイズを確認してください。');
    }
  });
});