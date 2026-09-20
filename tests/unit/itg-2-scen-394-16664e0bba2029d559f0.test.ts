import { executePlacementChangeWithApproval } from '../../src/logic/placement-change-execution';
import * as placementChangeExecutionModule from '../../src/logic/placement-change-execution';

describe('SCEN-394: executePlacementChangeWithApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('承認者が有効な権限を持ち、配置案が承認前の有効な状態にあり、対象作業者が配置可能で、スキル要件を満たし、人員配置に矛盾がない場合、割当変更履歴が記録され、配置指示が配信される', async () => {
    // 承認者権限の検証をスタブ化
    jest.spyOn(placementChangeExecutionModule, 'authorizeUserAction' as any).mockResolvedValue({
      authorized: true,
      userId: 'approver-123',
    });

    // 配置案が承認前の有効な状態にあることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementProposalId: 'proposal-001',
      status: '承認前',
      workerId: 'worker-789',
      newDepartmentId: 'dept-001',
      newWorkTypeId: 'worktype-001',
      changeReason: 'テスト配置理由',
    });

    // 対象作業者が配置可能であることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-789',
      workerName: 'テスト作業者',
      status: '配置可能',
      departmentId: 'dept-000',
    });

    // スキル要件を満たしていることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'worktype-001',
      workTypeName: 'テスト作業タイプ',
      requiredSkills: ['スキルA'],
    });

    // 人員配置に矛盾がないことをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'judgePersonnelReallocationFeasibility' as any).mockResolvedValue({
      feasible: true,
      conflictDetails: null,
    });

    // 割当変更履歴の保存が成功することをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'saveAllocationChangeHistory' as any).mockResolvedValue({
      allocationChangeHistoryId: 'history-001',
      success: true,
    });

    // 配置指示が現場リーダーに配信されることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'deliverPlacementInstructionToFieldLeader' as any).mockResolvedValue({
      delivered: true,
      fieldLeaderUserId: 'leader-001',
      deliveryMethod: 'メール',
      deliveryTimestamp: new Date().toISOString(),
      deliveryErrorMessage: null,
    });

    const input = {
      placementProposalId: 'proposal-001',
      approverUserId: 'approver-123',
      executorUserId: 'executor-456',
      approvalReason: 'テスト承認理由',
      executionNotes: 'テスト実行備考',
      requestTimestamp: new Date().toISOString(),
    };

    const result = await executePlacementChangeWithApproval(input);

    expect(result.success).toBe(true);
    expect(result.allocationChangeHistoryId).not.toBeNull();
    expect(typeof result.allocationChangeHistoryId).toBe('string');
    expect(result.newPlacementPlanId).not.toBeNull();
    expect(typeof result.newPlacementPlanId).toBe('string');
    expect(result.placementChangeDetails).not.toBeNull();
    expect(result.placementChangeDetails?.workerId).toBeDefined();
    expect(result.placementChangeDetails?.workerName).toBeDefined();
    expect(result.placementChangeDetails?.previousDepartmentId).toBeDefined();
    expect(result.placementChangeDetails?.previousDepartmentName).toBeDefined();
    expect(result.placementChangeDetails?.newDepartmentId).toBeDefined();
    expect(result.placementChangeDetails?.newDepartmentName).toBeDefined();
    expect(result.placementChangeDetails?.previousWorkTypeId).toBeDefined();
    expect(result.placementChangeDetails?.previousWorkTypeName).toBeDefined();
    expect(result.placementChangeDetails?.newWorkTypeId).toBeDefined();
    expect(result.placementChangeDetails?.newWorkTypeName).toBeDefined();
    expect(result.placementChangeDetails?.changeReason).toBeDefined();
    expect(result.notificationStatus.delivered).toBe(true);
    expect(result.notificationStatus.fieldLeaderUserId).toBeDefined();
    expect(result.notificationStatus.deliveryMethod).toBeDefined();
    expect(result.notificationStatus.deliveryTimestamp).not.toBeNull();
    expect(result.notificationStatus.deliveryErrorMessage).toBeNull();
    expect(result.errorMessage).toBeNull();

    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp instanceof Date).toBe(true);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });

  test('割当変更履歴がデータベースに永続化される', async () => {
    // 承認者権限の検証をスタブ化
    jest.spyOn(placementChangeExecutionModule, 'authorizeUserAction' as any).mockResolvedValue({
      authorized: true,
      userId: 'approver-123',
    });

    // 配置案が承認前の有効な状態にあることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementProposalId: 'proposal-001',
      status: '承認前',
      workerId: 'worker-789',
      newDepartmentId: 'dept-001',
      newWorkTypeId: 'worktype-001',
      changeReason: 'テスト配置理由',
    });

    // 対象作業者が配置可能であることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-789',
      workerName: 'テスト作業者',
      status: '配置可能',
      departmentId: 'dept-000',
    });

    // スキル要件を満たしていることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'worktype-001',
      workTypeName: 'テスト作業タイプ',
      requiredSkills: ['スキルA'],
    });

    // 人員配置に矛盾がないことをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'judgePersonnelReallocationFeasibility' as any).mockResolvedValue({
      feasible: true,
      conflictDetails: null,
    });

    // 割当変更履歴の保存が成功することをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'saveAllocationChangeHistory' as any).mockResolvedValue({
      allocationChangeHistoryId: 'history-001',
      success: true,
    });

    // 配置指示が現場リーダーに配信されることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'deliverPlacementInstructionToFieldLeader' as any).mockResolvedValue({
      delivered: true,
      fieldLeaderUserId: 'leader-001',
      deliveryMethod: 'メール',
      deliveryTimestamp: new Date().toISOString(),
      deliveryErrorMessage: null,
    });

    const input = {
      placementProposalId: 'proposal-001',
      approverUserId: 'approver-123',
      executorUserId: 'executor-456',
      requestTimestamp: new Date().toISOString(),
    };

    const result = await executePlacementChangeWithApproval(input);

    expect(result.success).toBe(true);
    expect(result.allocationChangeHistoryId).not.toBeNull();
    expect(typeof result.allocationChangeHistoryId).toBe('string');
  });

  test('現場リーダーへの配置指示が配信される', async () => {
    // 承認者権限の検証をスタブ化
    jest.spyOn(placementChangeExecutionModule, 'authorizeUserAction' as any).mockResolvedValue({
      authorized: true,
      userId: 'approver-123',
    });

    // 配置案が承認前の有効な状態にあることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementProposalId: 'proposal-001',
      status: '承認前',
      workerId: 'worker-789',
      newDepartmentId: 'dept-001',
      newWorkTypeId: 'worktype-001',
      changeReason: 'テスト配置理由',
    });

    // 対象作業者が配置可能であることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-789',
      workerName: 'テスト作業者',
      status: '配置可能',
      departmentId: 'dept-000',
    });

    // スキル要件を満たしていることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'worktype-001',
      workTypeName: 'テスト作業タイプ',
      requiredSkills: ['スキルA'],
    });

    // 人員配置に矛盾がないことをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'judgePersonnelReallocationFeasibility' as any).mockResolvedValue({
      feasible: true,
      conflictDetails: null,
    });

    // 割当変更履歴の保存が成功することをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'saveAllocationChangeHistory' as any).mockResolvedValue({
      allocationChangeHistoryId: 'history-001',
      success: true,
    });

    // 配置指示が現場リーダーに配信されることをスタブ化
    jest.spyOn(placementChangeExecutionModule, 'deliverPlacementInstructionToFieldLeader' as any).mockResolvedValue({
      delivered: true,
      fieldLeaderUserId: 'leader-001',
      deliveryMethod: 'メール',
      deliveryTimestamp: new Date().toISOString(),
      deliveryErrorMessage: null,
    });

    const input = {
      placementProposalId: 'proposal-001',
      approverUserId: 'approver-123',
      executorUserId: 'executor-456',
      requestTimestamp: new Date().toISOString(),
    };

    const result = await executePlacementChangeWithApproval(input);

    expect(result.success).toBe(true);
    expect(result.notificationStatus.delivered).toBe(true);
    expect(result.notificationStatus.fieldLeaderUserId).toBeDefined();
    expect(result.notificationStatus.deliveryTimestamp).not.toBeNull();
    expect(typeof result.notificationStatus.deliveryTimestamp).toBe('string');
  });
});