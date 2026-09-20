import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1085: ハンディターミナル連携ログ検索時のページサイズ上限値超過エラー', () => {
  it('ページサイズが上限値を超える場合、InvalidSearchConditionError が発生する', async () => {
    const input = {
      pageSize: 10001,
    };

    await expect(listHandyTerminalSyncLogByCondition(input)).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: '検索条件が無効です。日時範囲またはページネーション設定を確認してください。',
    });
  });
});