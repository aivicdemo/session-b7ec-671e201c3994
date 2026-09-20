import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-786: 作成日時の開始日時が終了日時より後の場合にエラーを返す', () => {
  it('createdFromDate が createdToDate より後の場合、InvalidSearchConditionError をスローする', async () => {
    const input = {
      createdFromDate: '2024-12-31T10:00:00Z',
      createdToDate: '2024-12-25T15:00:00Z',
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: '検索条件の日付または数値範囲が無効です。開始日時は終了日時以前、最小値は最大値以下である必要があります。',
      })
    );
  });
});