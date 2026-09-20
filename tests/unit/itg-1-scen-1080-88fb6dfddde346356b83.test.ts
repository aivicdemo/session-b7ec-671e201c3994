import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1080: ハンディターミナル連携ログ検索 - 無効な日時範囲エラー', () => {
  it('受信日時の開始日時が終了日時より後の場合、InvalidSearchConditionErrorが発生する', async () => {
    const input = {
      receivedDateFromDateTime: '2024-01-15T10:00:00Z',
      receivedDateToDateTime: '2024-01-15T09:00:00Z',
    };

    await expect(
      listHandyTerminalSyncLogByCondition(input)
    ).rejects.toThrow('検索条件が無効です。日時範囲またはページネーション設定を確認してください。');
  });
});