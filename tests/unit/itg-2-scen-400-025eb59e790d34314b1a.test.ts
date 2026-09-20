import { executePlacementChangeWithApproval } from '../../src/logic/placement-change-execution';
import type {
  ExecutePlacementChangeWithApprovalInput,
  ExecutePlacementChangeWithApprovalOutput,
} from '../../src/logic/placement-change-execution';

describe('SCEN-400: 配置変更により同一部門・同一作業タイプで人員不足が発生する場合', () => {
  it('should return PlacementConflictDetected error when personnel shortage occurs', async () => {
    const now = new Date().toISOString();

    const input: ExecutePlacementChangeWithApprovalInput = {
      placementProposalId: 'proposal-001',
      approverUserId: 'approver-user-001',
      executorUserId: 'executor-user-001',
      requestTimestamp: now,
    };

    const result: ExecutePlacementChangeWithApprovalOutput = await executePlacementChangeWithApproval(input);

    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBeNull();
    expect(result.newPlacementPlanId).toBeNull();
    expect(result.placementChangeDetails).toBeNull();
    expect(result.errorMessage).toBe('この配置変更により人員配置に矛盾が生じます。');
    expect(result.notificationStatus).toBeDefined();
    expect(result.notificationStatus.delivered).toBe(false);
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });
});