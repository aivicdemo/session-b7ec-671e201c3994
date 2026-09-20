import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-689: listWorkInstructionsByCondition - Invalid datetime range error handling', () => {
  it('should return InvalidSearchConditionError when plannedStartFromDateTime is after plannedStartToDateTime', async () => {
    const input = {
      plannedStartFromDateTime: '2024-01-15T10:00:00Z',
      plannedStartToDateTime: '2024-01-10T18:00:00Z',
    };

    await expect(listWorkInstructionsByCondition(input)).rejects.toMatchObject({
      name: expect.stringContaining('InvalidSearchConditionError'),
      message: expect.stringContaining('検索条件が不正です。日時範囲と数値範囲を確認してください。'),
    });
  });
});