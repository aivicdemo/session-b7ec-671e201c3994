import { listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1082: listHandyTerminalSyncLogByCondition エラーケース', () => {
  it('作成日時の開始日時が終了日時より後の場合、InvalidSearchConditionError が発生する', async () => {
    const input = {
      createdFromDate: '2024-12-31T23:59:59Z',
      createdToDate: '2024-12-01T00:00:00Z',
    };

    await expect(listHandyTerminalSyncLogByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: expect.stringContaining('検索条件が無効です'),
      })
    );
  });
});