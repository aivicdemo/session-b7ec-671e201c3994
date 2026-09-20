import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-1119', () => {
  describe('ページサイズが1未満に指定された場合のエラー処理', () => {
    it('pageSize が 0 の場合、InvalidSearchConditionError が発生する', async () => {
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
        pageNumber: undefined,
        pageSize: 0,
      };

      await expect(listWmsSyncLogByCondition(input)).rejects.toMatchObject({
        name: 'InvalidSearchConditionError',
        message: expect.stringContaining('検索条件が無効です'),
      });
    });
  });
});