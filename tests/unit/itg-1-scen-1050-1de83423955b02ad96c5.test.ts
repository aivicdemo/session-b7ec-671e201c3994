import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';
import { InvalidSearchConditionError } from '../../src/errors';

jest.mock('../../src/logic/validation-common-calculation', () => ({
  validateDateTimeRange: jest.fn((fromDate: string, toDate: string) => {
    if (new Date(fromDate) > new Date(toDate)) {
      throw new InvalidSearchConditionError('検索条件の日時または数値範囲が不正です。');
    }
  }),
}));

describe('SCEN-1050: listWorkInstructionReceptionHistoryByCondition - 日時範囲エラー', () => {
  it('作成日時の検索開始日時が終了日時より後の場合、日時範囲エラーが発生する', async () => {
    const input = {
      createdFromDate: '2024-01-31T23:59:59Z',
      createdToDate: '2024-01-01T00:00:00Z',
    };

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toThrow(InvalidSearchConditionError);

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toThrow('検索条件の日時または数値範囲が不正です。');
  });
});