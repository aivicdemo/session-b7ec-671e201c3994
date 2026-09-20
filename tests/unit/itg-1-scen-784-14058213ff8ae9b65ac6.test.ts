import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-784: 配置開始日の開始日時が終了日時より後の場合にエラーを返す', () => {
  it('allocationStartFromDateが allocationStartToDateより後の場合、InvalidSearchConditionErrorを発生させる', async () => {
    const input = {
      allocationStartFromDate: '2024-01-15T10:00:00Z',
      allocationStartToDate: '2024-01-10T18:00:00Z',
    };

    await expect(
      listAllocationPlansByCondition(input)
    ).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: '検索条件の日付または数値範囲が無効です。開始日時は終了日時以前、最小値は最大値以下である必要があります。',
    });
  });
});