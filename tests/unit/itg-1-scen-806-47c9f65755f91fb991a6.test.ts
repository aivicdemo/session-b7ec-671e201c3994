import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-806: 人員配置案一覧取得時のISO 8601形式タイムスタンプ検証', () => {
  it('retrivedAtフィールドがISO 8601形式で返される', async () => {
    const input = {
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
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const output = await listAllocationPlansByCondition(input);

    expect(output).toBeDefined();
    expect(output.retrievedAt).toBeDefined();

    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3,6})?(Z|[+-]\d{2}:\d{2})$/;
    expect(output.retrievedAt).toMatch(iso8601Pattern);

    const dateObj = new Date(output.retrievedAt);
    expect(dateObj instanceof Date && !isNaN(dateObj.getTime())).toBe(true);
  });
});