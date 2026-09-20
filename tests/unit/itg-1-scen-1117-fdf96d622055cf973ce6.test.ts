import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1117: WMS連携ログ検索条件の日時範囲逆順エラー', () => {
  test('連携開始日時の開始が終了より後の場合、InvalidSearchConditionError が発生する', async () => {
    const input = {
      wmsSyncLogIds: null,
      syncTypes: null,
      syncDirections: null,
      facilityIds: null,
      syncStatuses: null,
      syncStartFromDateTime: '2024-01-15T10:00:00Z',
      syncStartToDateTime: '2024-01-15T09:00:00Z',
      syncCompletedFromDateTime: null,
      syncCompletedToDateTime: null,
      minProcessedItemCount: null,
      maxProcessedItemCount: null,
      minRetryCount: null,
      maxRetryCount: null,
      wmsRequestIds: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    let thrownError;
    try {
      await listWmsSyncLogByCondition(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('InvalidSearchConditionError');
    expect(thrownError.message).toBe(
      '検索条件が無効です。日時範囲またはページサイズを確認してください。'
    );
  });
});