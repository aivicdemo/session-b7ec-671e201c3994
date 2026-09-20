import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-201: 複数の人員配置実行状況レコードが作成された場合、全レコードIDをallocationExecutionStatusIdsリストに含めて返す', () => {
  let mockGetAllocationPlanById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockListWorkersByCondition: jest.Mock;
  let mockGetFacilityById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;
  let mockSaveAllocationExecutionStatus: jest.Mock;
  let mockSaveWorkInstructionReceptionHistory: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllocationPlanById = jest.fn().mockResolvedValue({
      allocationPlanId: 'plan-001',
      configName: 'Test Plan',
      facilityId: 'facility-001',
      teamId: 'team-001',
      status: 'approved',
      workInstructionIds: ['work-instr-001', 'work-instr-002', 'work-instr-003'],
    });

    mockGetWorkInstructionById = jest.fn()
      .mockResolvedValueOnce({
        workInstructionId: 'work-instr-001',
        workName: 'Task 1',
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
      })
      .mockResolvedValueOnce({
        workInstructionId: 'work-instr-002',
        workName: 'Task 2',
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
      })
      .mockResolvedValueOnce({
        workInstructionId: 'work-instr-003',
        workName: 'Task 3',
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
      });

    mockListWorkersByCondition = jest.fn().mockResolvedValue([
      { workerId: 'worker-001', status: 'active' },
      { workerId: 'worker-002', status: 'active' },
      { workerId: 'worker-003', status: 'active' },
    ]);

    mockGetFacilityById = jest.fn().mockResolvedValue({
      facilityId: 'facility-001',
      maxCapacity: 100,
      currentStaffCount: 50,
    });

    mockGetTeamById = jest.fn().mockResolvedValue({
      teamId: 'team-001',
      teamName: 'Test Team',
    });

    mockListAllocationExecutionStatusByCondition = jest.fn().mockResolvedValue([]);

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    mockDeliverAllocationInstructionToFieldLeader = jest.fn().mockResolvedValue({
      deliveryId: 'delivery-001',
      deliveryStatus: 'success',
      deliveredChannels: ['email', 'app_notification'],
      fieldLeaderId: 'leader-001',
    });

    let callCount = 0;
    mockSaveAllocationExecutionStatus = jest.fn().mockImplementation(() => {
      const ids = ['exec-status-001', 'exec-status-002', 'exec-status-003'];
      return Promise.resolve(ids[callCount++]);
    });

    mockSaveWorkInstructionReceptionHistory = jest.fn().mockResolvedValue({
      receptionHistoryId: 'reception-001',
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditLogId: 'audit-001',
    });
  });

  it('should include all allocation execution status record IDs in the returned list when multiple records are created', async () => {
    // テスト前提条件の検証（モック設定で実装済み）

    // 関数の呼び出し
    const result = await deliverAllocationPlanAndWorkInstructions(
      {
        allocationPlanId: 'plan-001',
        operatingUserId: 'user-admin-001',
        deliveryNotes: '緊急配置のため至急対応願います',
      },
      {
        getAllocationPlanById: mockGetAllocationPlanById,
        getWorkInstructionById: mockGetWorkInstructionById,
        listWorkersByCondition: mockListWorkersByCondition,
        getFacilityById: mockGetFacilityById,
        getTeamById: mockGetTeamById,
        listAllocationExecutionStatusByCondition: mockListAllocationExecutionStatusByCondition,
        authorizeOperation: mockAuthorizeOperation,
        deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
        saveAllocationExecutionStatus: mockSaveAllocationExecutionStatus,
        saveWorkInstructionReceptionHistory: mockSaveWorkInstructionReceptionHistory,
        recordOperationAudit: mockRecordOperationAudit,
      }
    );

    // 戻り値のallocationExecutionStatusIdsリストの要素数を確認
    expect(result.allocationExecutionStatusIds).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatusIds)).toBe(true);
    expect(result.allocationExecutionStatusIds.length).toBeGreaterThanOrEqual(3);

    // すべてのレコードIDが含まれていることを確認
    expect(result.allocationExecutionStatusIds).toContain('exec-status-001');
    expect(result.allocationExecutionStatusIds).toContain('exec-status-002');
    expect(result.allocationExecutionStatusIds).toContain('exec-status-003');

    // 戻り値のdeliveryIdが正常な文字列形式であることを確認
    expect(result.deliveryId).toBeDefined();
    expect(typeof result.deliveryId).toBe('string');
    expect(result.deliveryId.length).toBeGreaterThan(0);

    // 戻り値のdeliveryStatusが'success'であることを確認
    expect(result.deliveryStatus).toBe('success');

    // 戻り値のdeliveredChannelsが複数のチャネルを含むリストであることを確認
    expect(result.deliveredChannels).toBeDefined();
    expect(Array.isArray(result.deliveredChannels)).toBe(true);
    expect(result.deliveredChannels.length).toBeGreaterThan(0);

    // 戻り値のfailedWorkerIdsが空のリストであることを確認
    expect(result.failedWorkerIds).toBeDefined();
    expect(Array.isArray(result.failedWorkerIds)).toBe(true);
    expect(result.failedWorkerIds.length).toBe(0);
  });
});