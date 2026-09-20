import { executePlacementChangeWithApproval } from '../../src/logic/placement-change-execution';

describe('割当変更履歴の保存に失敗した場合のエラーハンドリング', () => {
  it('割当変更履歴の保存に失敗した場合、エラー「配置変更の記録に失敗しました。システム管理者に連絡してください。」が返される', async () => {
    // 入力値を準備する
    const input = {
      placementProposalId: 'PROP-001',
      approverUserId: 'USER-A',
      executorUserId: 'USER-B',
      approvalReason: '生産性向上のため',
      executionNotes: '即日実施',
      requestTimestamp: '2025-01-15T10:30:00Z',
    };

    // スタブ処理の事前設定
    const mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });
    const mockValidateInputData = jest.fn().mockResolvedValue({ valid: true });
    const mockFindPlacementPlanByWorkerAndDate = jest.fn().mockResolvedValue({
      placementPlanId: 'PLAN-001',
      workerId: 'WORKER-001',
      departmentId: 'DEPT-001',
      workTypeId: 'WTYPE-001',
    });
    const mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'WORKER-001',
      workerName: '作業者名',
    });
    const mockFindWorkTypeById = jest.fn().mockResolvedValue({
      workTypeId: 'WTYPE-001',
      workTypeName: '作業タイプ名',
    });
    const mockFindDepartmentById = jest.fn().mockResolvedValue({
      departmentId: 'DEPT-001',
      departmentName: '部門名',
    });
    const mockJudgePersonnelReallocationFeasibility = jest.fn().mockResolvedValue({
      feasible: true,
    });
    const mockSavePlacementPlan = jest.fn().mockResolvedValue({
      placementPlanId: 'NEW-PLAN-001',
    });
    const mockSaveAllocationChangeHistory = jest.fn().mockRejectedValue(
      new Error('Data persistence error')
    );
    const mockDeliverPlacementInstructionToFieldLeader = jest.fn();
    const mockSendNotificationToAdministrator = jest.fn();

    // モックを注入してexecutePlacementChangeWithApprovalを呼び出す
    const result = await executePlacementChangeWithApproval(input, {
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findPlacementPlanByWorkerAndDate: mockFindPlacementPlanByWorkerAndDate,
      findWorkerById: mockFindWorkerById,
      findWorkTypeById: mockFindWorkTypeById,
      findDepartmentById: mockFindDepartmentById,
      judgePersonnelReallocationFeasibility: mockJudgePersonnelReallocationFeasibility,
      savePlacementPlan: mockSavePlacementPlan,
      saveAllocationChangeHistory: mockSaveAllocationChangeHistory,
      deliverPlacementInstructionToFieldLeader: mockDeliverPlacementInstructionToFieldLeader,
      sendNotificationToAdministrator: mockSendNotificationToAdministrator,
    });

    // 戻り値を検証する
    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBeNull();
    expect(result.newPlacementPlanId).toBeNull();
    expect(result.placementChangeDetails).toBeNull();
    expect(result.errorMessage).toBe(
      '配置変更の記録に失敗しました。システム管理者に連絡してください。'
    );
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // saveAllocationChangeHistoryが呼び出されたことを確認
    expect(mockSaveAllocationChangeHistory).toHaveBeenCalled();

    // 現場リーダーへの配置指示配信処理が呼び出されていないことを確認
    expect(mockDeliverPlacementInstructionToFieldLeader).not.toHaveBeenCalled();

    // 管理者通知処理が呼び出されたことを確認
    expect(mockSendNotificationToAdministrator).toHaveBeenCalled();
  });
});