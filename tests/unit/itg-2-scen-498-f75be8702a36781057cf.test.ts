import { savePlacementPlan } from '../../src/logic/persistence-layer';

describe('SCEN-498: 既存の配置計画を更新し、成功と配置計画IDを返す', () => {
  it('既存の配置計画レコードを更新して、成功フラグと同一の配置計画IDを返す', async () => {
    const placementPlanId = 'plan-existing-001';
    const workerId = 'worker-123';
    const requestingUserId = 'user-456';
    const createdBy = 'user-100';
    const updatedBy = 'user-456';
    const departmentId = 'dept-shipping';
    const jobType = 'packing';
    const startDate = new Date('2025-02-01');
    const endDate = new Date('2025-02-28');
    const expectedProductivityTarget = 150.5;
    const optimizationReason = '高生産性実績者を配置';

    const input = {
      placementPlanId,
      workerId,
      placementDepartment: departmentId,
      placementJobType: jobType,
      startDate,
      endDate,
      placementStatus: 'active' as const,
      expectedProductivityTarget,
      optimizationReason,
      createdBy,
      updatedBy,
      requestingUserId,
      operation: 'update' as const,
    };

    const result = await savePlacementPlan(input);

    expect(result.success).toBe(true);
    expect(result.placementPlanId).toBe(placementPlanId);
    expect(result.operation).toBe('update');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});