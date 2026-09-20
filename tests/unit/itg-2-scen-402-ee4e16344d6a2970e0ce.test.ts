import { executePlacementChangeWithApproval } from '../../src/logic/placement-change-execution';
import * as placementChangeExecutionModule from '../../src/logic/placement-change-execution';

describe('SCEN-402: 配置指示配信失敗時のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('現場リーダーへの配置指示配信に失敗した場合、適切なエラーメッセージが返される', async () => {
    // 事前条件：スタブを構成する
    const mockPlacementPlan = {
      id: 'plan-001',
      workerId: 'worker-001',
      configDate: '2024-01-15',
      departmentId: 'dept-001',
      workTypeId: 'worktype-001',
    };

    const mockWorker = {
      id: 'worker-001',
      name: '作業者A',
    };

    const mockWorkType = {
      id: 'worktype-001',
      name: '組立',
    };

    const mockDepartment = {
      id: 'dept-001',
      name: '製造部',
    };

    const mockNewDepartment = {
      id: 'dept-002',
      name: '品質管理部',
    };

    const mockNewWorkType = {
      id: 'worktype-002',
      name: '検査',
    };

    const historyId = 'history-001';
    const newPlanId = 'new-plan-001';
    const timestamp = new Date().toISOString();

    // authorizeUserAction を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'authorizeUserAction' as any)
      .mockResolvedValue(true);

    // validateInputData を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'validateInputData' as any)
      .mockResolvedValue(true);

    // findPlacementPlanByWorkerAndDate を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'findPlacementPlanByWorkerAndDate' as any)
      .mockResolvedValue(mockPlacementPlan);

    // findWorkerById を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'findWorkerById' as any)
      .mockResolvedValue(mockWorker);

    // findWorkTypeById を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'findWorkTypeById' as any)
      .mockImplementation((id: string) => {
        if (id === 'worktype-001') {
          return Promise.resolve(mockWorkType);
        } else if (id === 'worktype-002') {
          return Promise.resolve(mockNewWorkType);
        }
        return Promise.reject(new Error('Work type not found'));
      });

    // findDepartmentById を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'findDepartmentById' as any)
      .mockImplementation((id: string) => {
        if (id === 'dept-001') {
          return Promise.resolve(mockDepartment);
        } else if (id === 'dept-002') {
          return Promise.resolve(mockNewDepartment);
        }
        return Promise.reject(new Error('Department not found'));
      });

    // judgePersonnelReallocationFeasibility を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'judgePersonnelReallocationFeasibility' as any)
      .mockResolvedValue(true);

    // savePlacementPlan を成功するようにモック
    jest.spyOn(placementChangeExecutionModule, 'savePlacementPlan' as any)
      .mockResolvedValue(newPlanId);

    // saveAllocationChangeHistory を成功して履歴IDを返すようにモック
    jest.spyOn(placementChangeExecutionModule, 'saveAllocationChangeHistory' as any)
      .mockResolvedValue(historyId);

    // deliverPlacementInstructionToFieldLeader を失敗するようにモック
    jest.spyOn(placementChangeExecutionModule, 'deliverPlacementInstructionToFieldLeader' as any)
      .mockRejectedValue(new Error('NotificationDeliveryFailed'));

    const input = {
      placementProposalId: 'proposal-001',
      approverUserId: 'approver-user-001',
      executorUserId: 'executor-user-001',
      approvalReason: '生産性向上のため',
      executionNotes: '緊急配置',
      requestTimestamp: timestamp,
    };

    // 実行
    const result = await executePlacementChangeWithApproval(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBe(historyId);
    expect(result.allocationChangeHistoryId).not.toBeNull();
    expect(result.newPlacementPlanId).toBe(newPlanId);
    expect(result.newPlacementPlanId).not.toBeNull();
    expect(result.placementChangeDetails).not.toBeNull();
    expect(result.placementChangeDetails?.workerId).toBe('worker-001');
    expect(result.placementChangeDetails?.workerName).toBe('作業者A');
    expect(result.placementChangeDetails?.previousDepartmentId).toBe('dept-001');
    expect(result.placementChangeDetails?.previousDepartmentName).toBe('製造部');
    expect(result.placementChangeDetails?.newDepartmentId).toBe('dept-002');
    expect(result.placementChangeDetails?.newDepartmentName).toBe('品質管理部');
    expect(result.placementChangeDetails?.previousWorkTypeId).toBe('worktype-001');
    expect(result.placementChangeDetails?.previousWorkTypeName).toBe('組立');
    expect(result.placementChangeDetails?.newWorkTypeId).toBe('worktype-002');
    expect(result.placementChangeDetails?.newWorkTypeName).toBe('検査');
    expect(result.notificationStatus.delivered).toBe(false);
    expect(result.notificationStatus.deliveryErrorMessage).toBe(
      '配置指示の配信に失敗しました。手動で現場リーダーに通知してください。'
    );
    expect(result.notificationStatus.deliveryTimestamp).toBeNull();
    expect(result.errorMessage).toBe(
      '配置指示の配信に失敗しました。手動で現場リーダーに通知してください。'
    );
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});