import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1079: ハンディターミナル連携ログ検索 - 無効な日時範囲エラー', () => {
  it('送信日時の開始日時が終了日時より後の場合、InvalidSearchConditionErrorが発生する', async () => {
    const invalidCondition = {
      sentDateFromDateTime: '2024-01-15T10:00:00Z',
      sentDateToDateTime: '2024-01-10T15:00:00Z',
    };

    await expect(
      listHandyTerminalSyncLogByCondition(invalidCondition)
    ).rejects.toThrow(expect.objectContaining({
      name: expect.stringMatching(/InvalidSearchConditionError|Error/),
      message: expect.stringContaining('検索条件が無効です'),
    }));
  });
});