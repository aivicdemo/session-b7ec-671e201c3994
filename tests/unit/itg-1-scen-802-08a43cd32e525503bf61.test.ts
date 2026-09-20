import { listAllocationPlansByCondition, ListAllocationPlansByConditionInput, ListAllocationPlansByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-802: 複数の拠点IDを指定した場合に合致する配置案を取得できる', () => {
  it('複数の拠点IDを指定して配置案一覧を取得し、フィルタリングと詳細情報が正しく返却される', async () => {
    const input: ListAllocationPlansByConditionInput = {
      facilityIds: ['facility-001', 'facility-002', 'facility-003'],
      allocationPlanIds: undefined,
      teamIds: undefined,
      workInstructionIds: undefined,
      planNameKeyword: undefined,
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListAllocationPlansByConditionOutput = await listAllocationPlansByCondition(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    result.allocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.facilityId).toBeDefined();
      expect(typeof plan.facilityId).toBe('string');
      expect(['facility-001', 'facility-002', 'facility-003']).toContain(plan.facilityId);

      expect(plan.teamId).toBeDefined();
      expect(typeof plan.teamId).toBe('string');
      expect(plan.workInstructionId).toBeDefined();
      expect(typeof plan.workInstructionId).toBe('string');
      expect(plan.allocationStartDate).toBeDefined();
      expect(typeof plan.allocationStartDate).toBe('string');
      expect(plan.allocationStartDate).toMatch(iso8601Regex);

      expect(plan.allocationEndDate).toBeDefined();
      expect(typeof plan.allocationEndDate).toBe('string');
      expect(plan.allocationEndDate).toMatch(iso8601Regex);

      expect(plan.estimatedWorkHours).toBeDefined();
      expect(typeof plan.estimatedWorkHours).toBe('number');
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);

      expect(plan.status).toBeDefined();
      expect(typeof plan.status).toBe('string');
      expect(['提案中', '承認待ち', '承認済み', '実行中', '完了', '却下']).toContain(plan.status);
    });

    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
      expect(result.pageNumber).toBeGreaterThanOrEqual(1);
    }

    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
      expect(result.pageSize).toBeGreaterThanOrEqual(1);
    }
  });
});