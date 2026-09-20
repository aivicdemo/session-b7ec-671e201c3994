import { saveAllocationChangeHistory } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-644: 割当変更履歴保存 - 配置計画不在エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('変更前配置計画IDが存在しない場合、success=falseとPlacementPlanNotFoundErrorが返される', async () => {
    const mockAuthorizeUserAction = jest.spyOn(persistenceLayer as any, 'authorizeUserAction').mockResolvedValue({ authorized: true });
    const mockValidateInputData = jest.spyOn(persistenceLayer as any, 'validateInputData').mockResolvedValue({ valid: true });
    const mockFindPlacementPlanByWorkerAndDate = jest.spyOn(persistenceLayer as any, 'findPlacementPlanByWorkerAndDate').mockResolvedValue(null);
    const mockFindDepartmentById = jest.spyOn(persistenceLayer as any, 'findDepartmentById').mockResolvedValue({ departmentId: 'DEPT-001', found: true });
    const mockSaveToDatabase = jest.spyOn(persistenceLayer as any, 'saveToDatabase').mockResolvedValue({ saved: true });

    const input = {
      allocationChangeHistoryId: 'ACH-001',
      workerId: 'WKR-001',
      previousPlacementPlanId: 'PPP-999',
      newPlacementPlanId: 'NPP-001',
      previousDepartmentId: 'DEPT-001',
      newDepartmentId: 'DEPT-002',
      previousWorkTypeId: undefined,
      newWorkTypeId: undefined,
      changeReason: '生産性向上',
      changeReasonDetail: undefined,
      changeExecutionDate: new Date(),
      plannedChangeDate: undefined,
      executorUserId: 'USR-001',
      approverUserId: undefined,
      approvalDateTime: undefined,
      status: 'pending' as const,
      createdBy: 'USR-001',
      requestingUserId: 'USR-001',
    };

    const result = await saveAllocationChangeHistory(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('指定された配置計画が見つかりません。配置計画IDを確認してください。');
    expect(mockSaveToDatabase).not.toHaveBeenCalled();

    mockAuthorizeUserAction.mockRestore();
    mockValidateInputData.mockRestore();
    mockFindPlacementPlanByWorkerAndDate.mockRestore();
    mockFindDepartmentById.mockRestore();
    mockSaveToDatabase.mockRestore();
  });

  it('変更後配置計画IDが存在しない場合、success=falseとPlacementPlanNotFoundErrorが返される', async () => {
    const mockAuthorizeUserAction = jest.spyOn(persistenceLayer as any, 'authorizeUserAction').mockResolvedValue({ authorized: true });
    const mockValidateInputData = jest.spyOn(persistenceLayer as any, 'validateInputData').mockResolvedValue({ valid: true });
    const mockFindPlacementPlanByWorkerAndDate = jest.spyOn(persistenceLayer as any, 'findPlacementPlanByWorkerAndDate')
      .mockResolvedValueOnce({ placementPlanId: 'PPP-001', found: true })
      .mockResolvedValueOnce(null);
    const mockFindDepartmentById = jest.spyOn(persistenceLayer as any, 'findDepartmentById').mockResolvedValue({ departmentId: 'DEPT-002', found: true });
    const mockSaveToDatabase = jest.spyOn(persistenceLayer as any, 'saveToDatabase').mockResolvedValue({ saved: true });

    const input = {
      allocationChangeHistoryId: 'ACH-002',
      workerId: 'WKR-002',
      previousPlacementPlanId: 'PPP-001',
      newPlacementPlanId: 'NPP-999',
      previousDepartmentId: 'DEPT-001',
      newDepartmentId: 'DEPT-002',
      previousWorkTypeId: undefined,
      newWorkTypeId: undefined,
      changeReason: '生産性向上',
      changeReasonDetail: undefined,
      changeExecutionDate: new Date(),
      plannedChangeDate: undefined,
      executorUserId: 'USR-001',
      approverUserId: undefined,
      approvalDateTime: undefined,
      status: 'pending' as const,
      createdBy: 'USR-001',
      requestingUserId: 'USR-001',
    };

    const result = await saveAllocationChangeHistory(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('指定された配置計画が見つかりません。配置計画IDを確認してください。');
    expect(mockSaveToDatabase).not.toHaveBeenCalled();

    mockAuthorizeUserAction.mockRestore();
    mockValidateInputData.mockRestore();
    mockFindPlacementPlanByWorkerAndDate.mockRestore();
    mockFindDepartmentById.mockRestore();
    mockSaveToDatabase.mockRestore();
  });
});