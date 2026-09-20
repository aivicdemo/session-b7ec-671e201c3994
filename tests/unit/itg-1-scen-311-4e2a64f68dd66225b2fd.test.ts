import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-311: 指定された人員配置案IDが存在しないとき、AllocationPlanNotFoundErrorが発生する', () => {
  it('should throw AllocationPlanNotFoundError when allocation plan does not exist', async () => {
    const userId = 'user-123';
    const allocationPlanId = 'non-existent-plan-999';
    const manualDecision = null;
    const manualDecisionReason = null;

    try {
      await judgeAllocationPlanApprovalWithCriteria({
        userId,
        allocationPlanId,
        manualDecision,
        manualDecisionReason,
      });
      fail('Expected AllocationPlanNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.constructor.name).toBe('AllocationPlanNotFoundError');
      expect(error.message).toBe(`人員配置案が見つかりません: ${allocationPlanId}`);
    }
  });
});