import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('listWorkInstructionReceptionHistoryByCondition - SCEN-1049', () => {
  it('should throw InvalidSearchConditionError when confirmationDateFromDateTime is after confirmationDateToDateTime', async () => {
    const input = {
      confirmationDateFromDateTime: '2024-01-15T10:00:00Z',
      confirmationDateToDateTime: '2024-01-10T15:00:00Z',
    };

    await expect(listWorkInstructionReceptionHistoryByCondition(input)).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: '検索条件の日時または数値範囲が不正です。',
    });
  });
});