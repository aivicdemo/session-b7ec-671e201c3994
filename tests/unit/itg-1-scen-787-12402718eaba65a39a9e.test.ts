import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-787: listAllocationPlansByCondition - 日付範囲の逆順検証', () => {
  it('更新日時の開始日時が終了日時より後の場合にエラーを返す', async () => {
    const invalidSearchCondition = {
      updatedFromDate: '2024-01-15T10:00:00Z',
      updatedToDate: '2024-01-10T15:00:00Z',
      allocationPlanIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionIds: null,
      planNameKeyword: null,
      statuses: null,
      allocationStartFromDate: null,
      allocationStartToDate: null,
      allocationEndFromDate: null,
      allocationEndToDate: null,
      minEstimatedWorkHours: null,
      maxEstimatedWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    try {
      await listAllocationPlansByCondition(invalidSearchCondition);
      fail('InvalidSearchConditionErrorが発生することを期待していました');
    } catch (error: any) {
      expect(error.name).toBe('InvalidSearchConditionError');
      expect(error.message).toBe(
        '検索条件の日付または数値範囲が無効です。開始日時は終了日時以前、最小値は最大値以下である必要があります。'
      );
    }
  });
});