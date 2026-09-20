import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1051: listWorkInstructionReceptionHistoryByCondition - 日時範囲エラー検証', () => {
  it('更新日時の検索開始日時が終了日時より後の場合、InvalidSearchConditionError が発生する', async () => {
    const input = {
      updatedFromDate: '2024-01-31T23:59:59Z',
      updatedToDate: '2024-01-01T00:00:00Z',
    };

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: '検索条件の日時または数値範囲が不正です。',
      })
    );
  });
});