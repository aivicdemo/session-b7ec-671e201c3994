import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-795: 複数の検索条件を組み合わせた場合に該当する配置案のみを取得できる', () => {
  it('複数の検索条件を組み合わせて配置案を取得する', async () => {
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001'],
      statuses: ['承認済み', '実行中'],
      allocationStartFromDate: '2024-01-01',
      allocationStartToDate: '2024-12-31',
      minEstimatedWorkHours: 8,
      maxEstimatedWorkHours: 40,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listAllocationPlansByCondition(input);

    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    result.allocationPlans.forEach((plan) => {
      expect(['F001', 'F002']).toContain(plan.facilityId);

      expect(['T001']).toContain(plan.teamId);

      expect(['承認済み', '実行中']).toContain(plan.status);

      const startDate = new Date(plan.allocationStartDate);
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');
      expect(startDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(startDate.getTime()).toBeLessThanOrEqual(toDate.getTime());

      expect(plan.estimatedWorkHours).toBeGreaterThanOrEqual(8);
      expect(plan.estimatedWorkHours).toBeLessThanOrEqual(40);

      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(plan.planName).toBeDefined();
      expect(typeof plan.planName).toBe('string');
      expect(plan.workInstructionId).toBeDefined();
      expect(typeof plan.workInstructionId).toBe('string');
      expect(plan.allocationEndDate).toBeDefined();
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.createdAt).toBeDefined();
      expect(plan.updatedAt).toBeDefined();
      expect(plan.createdBy).toBeDefined();
    });

    if (result.allocationPlans.length > 0) {
      expect(result.totalCount).toBeGreaterThan(0);
    }
  });
});