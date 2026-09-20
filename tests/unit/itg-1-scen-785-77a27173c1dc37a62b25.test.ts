import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-785: 配置終了日の開始日時が終了日時より後の場合にエラーを返す', () => {
  test('allocationEndFromDateがallocationEndToDateより後の場合、InvalidSearchConditionErrorを返す', async () => {
    const invalidInput = {
      allocationPlanIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionIds: null,
      planNameKeyword: null,
      statuses: null,
      allocationStartFromDate: null,
      allocationStartToDate: null,
      allocationEndFromDate: '2024-12-31T00:00:00Z',
      allocationEndToDate: '2024-12-25T23:59:59Z',
      minEstimatedWorkHours: null,
      maxEstimatedWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    try {
      await listAllocationPlansByCondition(invalidInput);
      fail('エラーが発生するべきですが、成功してしまいました');
    } catch (error: any) {
      expect(error.name).toBe('InvalidSearchConditionError');
      expect(error.message).toContain('検索条件の日付または数値範囲が無効です');
      expect(error.message).toContain('開始日時は終了日時以前');
      expect(error.message).toContain('最小値は最大値以下である必要があります');
    }
  });
});