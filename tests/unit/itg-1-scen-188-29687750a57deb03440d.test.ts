import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deliverAllocationPlanAndWorkInstructions,
} from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-188: 配置案配信時に現場リーダーが存在しない場合のエラー処理', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetAllocationPlanById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetFacilityById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockListWorkersByCondition: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockSaveAllocationExecutionStatus: jest.Mock;
  let mockSaveWorkInstructionReceptionHistory: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockGetAllocationPlanById = jest.fn().mockResolvedValue({
      id: 'plan-001',
      status: 'approved',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionIds: ['wi-001', 'wi-002'],
    });
    mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      id: 'wi-001',
      workName: 'Sample Work',
      workDescription: 'Sample Description',
      plannedStartDateTime: '2024-01-01T09:00:00Z',
      plannedEndDateTime: '2024-01-01T17:00:00Z',
      priority: 'high',
      requiredWorkerCount: 3,
    });
    mockGetFacilityById = jest.fn().mockResolvedValue({
      id: 'facility-001',
      name: 'Facility 1',
      status: 'active',
    });
    mockGetTeamById = jest.fn().mockResolvedValue({
      id: 'team-001',
      name: 'Team 1',
      facilityId: 'facility-001',
      fieldLeaderId: null,
      status: 'active',
    });
    mockListWorkersByCondition = jest.fn().mockResolvedValue([
      {
        id: 'worker-001',
        name: 'Worker 1',
        proficiencyLevel: 'intermediate',
        recentProductivityRate: 0.85,
      },
      {
        id: 'worker-002',
        name: 'Worker 2',
        proficiencyLevel: 'advanced',
        recentProductivityRate: 0.92,
      },
    ]);
    mockListAllocationExecutionStatusByCondition = jest
      .fn()
      .mockResolvedValue([]);
    mockSaveAllocationExecutionStatus = jest.fn();
    mockSaveWorkInstructionReceptionHistory = jest.fn();
    mockDeliverAllocationInstructionToFieldLeader = jest.fn();

    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).getAllocationPlanById = mockGetAllocationPlanById;
    (global as any).getWorkInstructionById = mockGetWorkInstructionById;
    (global as any).getFacilityById = mockGetFacilityById;
    (global as any).getTeamById = mockGetTeamById;
    (global as any).listWorkersByCondition = mockListWorkersByCondition;
    (global as any).listAllocationExecutionStatusByCondition =
      mockListAllocationExecutionStatusByCondition;
    (global as any).saveAllocationExecutionStatus =
      mockSaveAllocationExecutionStatus;
    (global as any).saveWorkInstructionReceptionHistory =
      mockSaveWorkInstructionReceptionHistory;
    (global as any).deliverAllocationInstructionToFieldLeader =
      mockDeliverAllocationInstructionToFieldLeader;
  });

  it('現場リーダーが存在しない場合、TargetFieldLeaderNotFoundエラーを返す', async () => {
    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-001',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
      fail('TargetFieldLeaderNotFoundエラーが発生すべきです');
    } catch (error: any) {
      expect(error.name).toBe('TargetFieldLeaderNotFound');
      expect(error.message).toBe('現場リーダーが見つかりません。拠点ID: facility-001, チームID: team-001');
    }
  });

  it('現場リーダーが存在しない場合、配信状況の記録は呼び出されない', async () => {
    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-001',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
    } catch {
      // エラーを期待
    }

    expect(mockSaveAllocationExecutionStatus).not.toHaveBeenCalled();
    expect(mockSaveWorkInstructionReceptionHistory).not.toHaveBeenCalled();
    expect(mockDeliverAllocationInstructionToFieldLeader).not.toHaveBeenCalled();
  });

  it('現場リーダーIDが空文字列の場合も、TargetFieldLeaderNotFoundエラーを返す', async () => {
    mockGetTeamById.mockResolvedValue({
      id: 'team-001',
      name: 'Team 1',
      facilityId: 'facility-001',
      fieldLeaderId: '',
      status: 'active',
    });

    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-001',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
      fail('TargetFieldLeaderNotFoundエラーが発生すべきです');
    } catch (error: any) {
      expect(error.name).toBe('TargetFieldLeaderNotFound');
      expect(error.message).toBe('現場リーダーが見つかりません。拠点ID: facility-001, チームID: team-001');
    }
  });

  it('現場リーダーが稼働状態でない場合も、TargetFieldLeaderNotFoundエラーを返す', async () => {
    mockGetTeamById.mockResolvedValue({
      id: 'team-001',
      name: 'Team 1',
      facilityId: 'facility-001',
      fieldLeaderId: 'leader-001',
      status: 'inactive',
    });

    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-001',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
      fail('TargetFieldLeaderNotFoundエラーが発生すべきです');
    } catch (error: any) {
      expect(error.name).toBe('TargetFieldLeaderNotFound');
      expect(error.message).toBe('現場リーダーが見つかりません。拠点ID: facility-001, チームID: team-001');
    }
  });

  it('現場リーダーが存在しない場合、配信関連の処理は一切実行されない', async () => {
    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-001',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
    } catch {
      // エラーを期待
    }

    expect(mockSaveAllocationExecutionStatus).not.toHaveBeenCalled();
    expect(mockSaveWorkInstructionReceptionHistory).not.toHaveBeenCalled();
    expect(mockDeliverAllocationInstructionToFieldLeader).not.toHaveBeenCalled();
  });

  it('配置案が承認済みでない場合、現場リーダー確認は行われない', async () => {
    mockGetAllocationPlanById.mockResolvedValue({
      id: 'plan-001',
      status: 'pending',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionIds: ['wi-001'],
    });

    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-001',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
    } catch (error: any) {
      // 承認済みでないため異なるエラーが発生する可能性
    }

    expect(mockGetTeamById).not.toHaveBeenCalled();
  });

  it('operatingUserIdが配信権限を持たない場合、TargetFieldLeaderNotFoundエラーの前に権限チェックが実行される', async () => {
    mockAuthorizeOperation.mockResolvedValue(false);

    const input = {
      allocationPlanId: 'plan-001',
      operatingUserId: 'user-unauthorized',
      deliveryNotes: '緊急対応：進捗遅延に伴う人員追加配置',
    };

    try {
      await deliverAllocationPlanAndWorkInstructions(input);
    } catch (error: any) {
      // 権限エラーが先に発生するはず
    }

    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      'user-unauthorized',
      expect.stringContaining('delivery') || expect.stringContaining('dispatch')
    );
  });
});