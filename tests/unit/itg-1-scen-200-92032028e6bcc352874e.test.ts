import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';

describe('作業進捗・人員配置最適化エンジン - SCEN-200', () => {
  describe('配信メモが指定されていない場合でも、配信を実行して結果を返す', () => {
    it('deliveryNotesがnullの場合、配信が正常に実行される', async () => {
      // テスト対象の入力値を準備
      const allocationPlanId = 'plan-001';
      const operatingUserId = 'user-100';
      const deliveryNotes = null;

      // 配信処理のモック
      const mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
      const mockGetAllocationPlanById = jest.fn().mockResolvedValue({
        allocationPlanId: 'plan-001',
        status: 'approved',
        facilityId: 'fac-10',
        teamId: 'team-05',
        targetWorkerCount: 5,
        workInstructionIds: ['instr-001', 'instr-002'],
      });
      const mockGetWorkInstructionById = jest
        .fn()
        .mockImplementation((id) => {
          if (id === 'instr-001') {
            return Promise.resolve({
              workInstructionId: 'instr-001',
              workName: '組立作業A',
              plannedStartDateTime: '2025-01-15T08:00:00Z',
              plannedEndDateTime: '2025-01-15T17:00:00Z',
            });
          }
          if (id === 'instr-002') {
            return Promise.resolve({
              workInstructionId: 'instr-002',
              workName: '検査作業B',
              plannedStartDateTime: '2025-01-15T08:00:00Z',
              plannedEndDateTime: '2025-01-15T17:00:00Z',
            });
          }
          return Promise.reject(new Error('Unknown instruction'));
        });
      const mockListWorkersByCondition = jest.fn().mockResolvedValue([
        {
          workerId: 'worker-001',
          workerName: '作業者1',
          status: '稼働中',
          allocationConflict: false,
        },
        {
          workerId: 'worker-002',
          workerName: '作業者2',
          status: '稼働中',
          allocationConflict: false,
        },
        {
          workerId: 'worker-003',
          workerName: '作業者3',
          status: '稼働中',
          allocationConflict: false,
        },
        {
          workerId: 'worker-004',
          workerName: '作業者4',
          status: '稼働中',
          allocationConflict: false,
        },
        {
          workerId: 'worker-005',
          workerName: '作業者5',
          status: '稼働中',
          allocationConflict: false,
        },
      ]);
      const mockGetFacilityById = jest.fn().mockResolvedValue({
        facilityId: 'fac-10',
        facilityName: '東京拠点',
        maxCapacity: 10,
      });
      const mockGetTeamById = jest.fn().mockResolvedValue({
        teamId: 'team-05',
        teamName: 'チームA',
        fieldLeaderId: 'leader-20',
        status: '稼働中',
      });
      const mockDeliverAllocationInstructionToFieldLeader = jest
        .fn()
        .mockResolvedValue({
          deliveryId: 'delivery-777',
          deliveredChannels: ['email', 'app_notification'],
          deliveryTimestamp: '2025-01-15T09:30:00Z',
        });
      const mockSaveAllocationExecutionStatus = jest
        .fn()
        .mockResolvedValueOnce({ allocationExecutionStatusId: 'exec-status-001' })
        .mockResolvedValueOnce({ allocationExecutionStatusId: 'exec-status-002' })
        .mockResolvedValueOnce({ allocationExecutionStatusId: 'exec-status-003' });
      const mockSaveWorkInstructionReceptionHistory = jest
        .fn()
        .mockResolvedValue({
          receptionHistoryId: 'reception-hist-001',
        });
      const mockRecordOperationAudit = jest.fn().mockResolvedValue({
        auditLogId: 'audit-001',
      });

      // 関数を実行
      const result = await deliverAllocationPlanAndWorkInstructions(
        {
          allocationPlanId,
          operatingUserId,
          deliveryNotes,
        },
        {
          authorizeOperation: mockAuthorizeOperation,
          getAllocationPlanById: mockGetAllocationPlanById,
          getWorkInstructionById: mockGetWorkInstructionById,
          listWorkersByCondition: mockListWorkersByCondition,
          getFacilityById: mockGetFacilityById,
          getTeamById: mockGetTeamById,
          deliverAllocationInstructionToFieldLeader:
            mockDeliverAllocationInstructionToFieldLeader,
          saveAllocationExecutionStatus: mockSaveAllocationExecutionStatus,
          saveWorkInstructionReceptionHistory:
            mockSaveWorkInstructionReceptionHistory,
          recordOperationAudit: mockRecordOperationAudit,
        }
      );

      // 返却値の検証
      expect(result).toBeDefined();
      expect(result.deliveryId).toBe('delivery-777');
      expect(result.allocationPlanId).toBe('plan-001');
      expect(result.facilityId).toBe('fac-10');
      expect(result.teamId).toBe('team-05');
      expect(result.fieldLeaderId).toBe('leader-20');
      expect(result.targetWorkerCount).toBe(5);
      expect(result.workInstructionIds).toEqual(['instr-001', 'instr-002']);
      expect(result.deliveryStatus).toBe('success');
      expect(result.deliveredChannels).toEqual(['email', 'app_notification']);
      expect(result.failedWorkerIds).toEqual([]);
      expect(result.deliveryTimestamp).toBe('2025-01-15T09:30:00Z');
      expect(result.expectedReceptionDeadline).toBeDefined();
      expect(result.allocationExecutionStatusIds).toEqual([
        'exec-status-001',
        'exec-status-002',
        'exec-status-003',
      ]);

      // 配信処理が実行されたことを検証
      expect(mockAuthorizeOperation).toHaveBeenCalledWith(
        operatingUserId,
        'fac-10'
      );
      expect(mockGetAllocationPlanById).toHaveBeenCalledWith(allocationPlanId);
      expect(mockDeliverAllocationInstructionToFieldLeader).toHaveBeenCalled();
      expect(mockRecordOperationAudit).toHaveBeenCalled();
    });
  });
});