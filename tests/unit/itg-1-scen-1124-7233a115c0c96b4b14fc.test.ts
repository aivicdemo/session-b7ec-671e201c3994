import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1124: WMS連携ログ検索 - 該当なしエラー', () => {
  it('検索条件に合致するWMS連携ログが存在しない場合、NoResultsFoundErrorが発生する', async () => {
    // 実在しないWMS連携ログIDを指定
    const nonExistentLogIds = ['non-existent-log-id-001', 'non-existent-log-id-002'];

    // listWmsSyncLogByConditionを呼び出し
    const promise = listWmsSyncLogByCondition({
      wmsSyncLogIds: nonExistentLogIds,
    });

    // NoResultsFoundErrorが発生することを確認
    await expect(promise).rejects.toMatchObject({
      name: 'NoResultsFoundError',
      message: '指定された条件に合致するWMS連携ログはありません。',
    });
  });

  it('過去の日時範囲を指定してレコードが存在しない場合、NoResultsFoundErrorが発生する', async () => {
    const pastStartDate = '2020-01-01T00:00:00Z';
    const pastEndDate = '2020-01-31T23:59:59Z';

    // 過去の日時範囲でWMS連携ログを検索
    const promise = listWmsSyncLogByCondition({
      syncStartFromDateTime: pastStartDate,
      syncStartToDateTime: pastEndDate,
    });

    // NoResultsFoundErrorが発生することを確認
    await expect(promise).rejects.toMatchObject({
      name: 'NoResultsFoundError',
      message: '指定された条件に合致するWMS連携ログはありません。',
    });
  });

  it('複合条件で該当データがない場合、NoResultsFoundErrorが発生する', async () => {
    const nonExistentFacilityId = 'non-existent-facility-id';
    const nonExistentSyncType = 'non-existent-sync-type';

    // 複合条件でWMS連携ログを検索
    const promise = listWmsSyncLogByCondition({
      facilityIds: [nonExistentFacilityId],
      syncTypes: [nonExistentSyncType],
      syncStatuses: ['SUCCESS'],
    });

    // NoResultsFoundErrorが発生することを確認
    await expect(promise).rejects.toMatchObject({
      name: 'NoResultsFoundError',
      message: '指定された条件に合致するWMS連携ログはありません。',
    });
  });
});