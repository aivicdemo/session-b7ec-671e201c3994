import { savePlacementPlan } from '../../src/logic/persistence-layer';

describe('SCEN-493: 配置計画の保存 - 配置期間の妥当性検証', () => {
  it('配置開始日が配置終了日より後である場合、InvalidPlacementPeriodErrorが発生すること', async () => {
    const placementPlanInput = {
      placementPlanId: 'plan-001',
      workerId: 'worker-123',
      placementDepartment: 'dept-A',
      placementJobType: 'picker',
      startDate: new Date('2025-01-20'),
      endDate: new Date('2025-01-10'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: 'テスト',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePlacementPlan(placementPlanInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidPlacementPeriodError',
        message: '配置期間が無効です。開始日は終了日より前である必要があります。',
      })
    );
  });
});