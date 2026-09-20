import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deliverAllocationPlanAndWorkInstructions,
  DeliverAllocationPlanAndWorkInstructionsInput,
  DeliverAllocationPlanAndWorkInstructionsOutput,
} from '../../src/logic/work-instruction-delivery-manager';

// Mock the external notification adapter and dependencies
jest.mock('../../src/adapters/notification-service-adapter', () => ({
  NotificationServiceAdapter: {
    sendWorkInstruction: jest.fn(),
    sendStaffingPlan: jest.fn(),
    sendDelayRiskAlert: jest.fn(),
    getDeliveryStatus: jest.fn(),
  },
}));

jest.mock('../../src/adapters/database-adapter', () => ({
  DatabaseAdapter: {
    getAllocationPlanById: jest.fn(),
    getWorkInstructionById: jest.fn(),
    getFacilityById: jest.fn(),
    getTeamById: jest.fn(),
    listWorkersByCondition: jest.fn(),
    saveAllocationExecutionStatus: jest.fn(),
    saveWorkInstructionReceptionHistory: jest.fn(),
    recordOperationAudit: jest.fn(),
  },
}));

jest.mock('../../src/services/authorization-service', () => ({
  AuthorizationService: {
    authorizeOperation: jest.fn(),
  },
}));

jest.mock('../../src/adapters/delivery-channel-adapter', () => ({
  DeliveryChannelAdapter: {
    getAvailableChannels: jest.fn(),
    deliverAllocationInstructionToFieldLeader: jest.fn(),
  },
}));

describe('SCEN-196: 複数の配信チャネルが利用可能である場合、実際に成功したチャネルのみをdeliveredChannelsに含めて返す', () => {
  const testAllocationPlanId = 'plan-123';
  const testOperatingUserId = 'user-456';
  const testDeliveryNotes = 'Urgent delivery instructions';
  const testFieldLeaderId = 'leader-789';
  const testFacilityId = 'facility-001';
  const testTeamId = 'team-002';
  const testWorkInstructionId = 'wi-001';
  const availableChannels = ['email', 'app_notification', 'sms'];

  let notificationServiceAdapter: any;
  let databaseAdapter: any;
  let authorizationService: any;
  let deliveryChannelAdapter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import mocked modules
    const notifModule = require('../../src/adapters/notification-service-adapter');
    const dbModule = require('../../src/adapters/database-adapter');
    const authModule = require('../../src/services/authorization-service');
    const channelModule = require('../../src/adapters/delivery-channel-adapter');

    notificationServiceAdapter = notifModule.NotificationServiceAdapter;
    databaseAdapter = dbModule.DatabaseAdapter;
    authorizationService = authModule.AuthorizationService;
    deliveryChannelAdapter = channelModule.DeliveryChannelAdapter;
  });

  it('配信チャネルが複数ある場合、失敗したチャネルを除外してdeliveredChannelsに返す', async () => {
    // 承認済みの人員配置案、現場リーダー、作業指示、作業者が全て存在する状態を準備
    const mockAllocationPlan = {
      人員配置案ID: testAllocationPlanId,
      配置案名: 'Test Plan',
      拠点ID: testFacilityId,
      チームID: testTeamId,
      作業指示ID: testWorkInstructionId,
      配置開始日: new Date().toISOString(),
      予想工数: 100,
      ステータス: '承認済み',
      fieldLeaderId: testFieldLeaderId,
    };

    const mockFacility = {
      拠点ID: testFacilityId,
      拠点名: 'Test Facility',
      拠点コード: 'FAC001',
      最大収容人員数: 50,
      現在配置人員数: 25,
      稼働状況: '稼働中',
    };

    const mockTeam = {
      チームID: testTeamId,
      チーム名: 'Test Team',
      拠点ID: testFacilityId,
      チームリーダーID: testFieldLeaderId,
      稼働状況: '稼働中',
    };

    const mockWorkInstruction = {
      作業指示ID: testWorkInstructionId,
      拠点ID: testFacilityId,
      チームID: testTeamId,
      作業指示番号: 'WI-0001',
      作業名: 'Assembly Task',
      作業説明: 'Assembly test description',
      予定開始日時: new Date().toISOString(),
      予定終了日時: new Date(Date.now() + 86400000).toISOString(),
      進捗状況: '未開始',
      必要人数: 5,
      優先度: 'high',
    };

    const mockWorkers = [
      {
        作業者ID: 'worker-001',
        作業者名: 'Worker A',
        拠点ID: testFacilityId,
        チームID: testTeamId,
        職種: 'Assembly',
        稼働状況: '稼働中',
      },
      {
        作業者ID: 'worker-002',
        作業者名: 'Worker B',
        拠点ID: testFacilityId,
        チームID: testTeamId,
        職種: 'Assembly',
        稼働状況: '稼働中',
      },
    ];

    // 複数の配信チャネル（email、app_notification、sms）が利用可能に設定する
    deliveryChannelAdapter.getAvailableChannels.mockResolvedValue({
      channels: availableChannels,
      facilityId: testFacilityId,
      teamId: testTeamId,
    });

    // authorizeOperationをスタブで配信権限ありの状態に設定
    authorizationService.authorizeOperation.mockResolvedValue({
      authorized: true,
      userId: testOperatingUserId,
      facilityId: testFacilityId,
      teamId: testTeamId,
    });

    // getAllocationPlanById、getWorkInstructionById、listWorkersByCondition、getFacilityById、getTeamByIdをスタブで正常応答するよう設定
    databaseAdapter.getAllocationPlanById.mockResolvedValue(mockAllocationPlan);
    databaseAdapter.getWorkInstructionById.mockResolvedValue(mockWorkInstruction);
    databaseAdapter.getFacilityById.mockResolvedValue(mockFacility);
    databaseAdapter.getTeamById.mockResolvedValue(mockTeam);
    databaseAdapter.listWorkersByCondition.mockResolvedValue(mockWorkers);

    // saveAllocationExecutionStatus、saveWorkInstructionReceptionHistoryをスタブで正常保存するよう設定
    databaseAdapter.saveAllocationExecutionStatus.mockResolvedValue({
      人員配置実行状況ID: 'exec-status-001',
      配置状態: '配置済',
    });

    databaseAdapter.saveWorkInstructionReceptionHistory.mockResolvedValue({
      受領履歴ID: 'reception-history-001',
      受領確認状態: '未確認',
    });

    // recordOperationAuditをスタブで正常記録するよう設定
    databaseAdapter.recordOperationAudit.mockResolvedValue({
      操作履歴ID: 'audit-001',
      操作ステータス: '成功',
    });

    // deliverAllocationInstructionToFieldLeaderのスタブを設定し、emailとapp_notificationのみ成功（deliveryId返却）、smsは失敗（例外発生）するよう動作させる
    deliveryChannelAdapter.deliverAllocationInstructionToFieldLeader.mockImplementation(
      async (facilityId: string, teamId: string, fieldLeaderId: string, content: any, channel: string) => {
        if (channel === 'email') {
          return {
            deliveryId: `delivery-email-${Date.now()}`,
            channel: 'email',
            status: 'success',
          };
        } else if (channel === 'app_notification') {
          return {
            deliveryId: `delivery-app-${Date.now()}`,
            channel: 'app_notification',
            status: 'success',
          };
        } else if (channel === 'sms') {
          throw new Error('SMS gateway temporarily unavailable');
        }
      },
    );

    // 入力パラメータ（有効な allocationPlanId、operatingUserId、deliveryNotes を指定する）
    const input: DeliverAllocationPlanAndWorkInstructionsInput = {
      allocationPlanId: testAllocationPlanId,
      operatingUserId: testOperatingUserId,
      deliveryNotes: testDeliveryNotes,
    };

    // deliverAllocationPlanAndWorkInstructionsを呼び出す
    const result = await deliverAllocationPlanAndWorkInstructions(input);

    // 戻り値の deliveredChannels フィールドを確認する
    expect(result.deliveryStatus).toBe('partial_success');
    expect(result.deliveredChannels).toEqual(expect.arrayContaining(['email', 'app_notification']));
    expect(result.deliveredChannels).not.toContain('sms');
    expect(result.deliveredChannels.length).toBe(2);
    expect(result.deliveryId).toBeDefined();
    expect(result.allocationPlanId).toBe(testAllocationPlanId);
    expect(result.facilityId).toBe(testFacilityId);
    expect(result.teamId).toBe(testTeamId);
    expect(result.fieldLeaderId).toBe(testFieldLeaderId);
    expect(result.targetWorkerCount).toBe(mockWorkers.length);
    expect(result.workInstructionIds).toContain(testWorkInstructionId);
    expect(Array.isArray(result.failedWorkerIds)).toBe(true);
    expect(result.deliveryTimestamp).toBeDefined();
    expect(result.expectedReceptionDeadline).toBeDefined();
    expect(result.allocationExecutionStatusIds).toBeDefined();
    expect(result.allocationExecutionStatusIds.length).toBeGreaterThan(0);

    // 依存サービスが期待通り呼び出されたことを確認
    expect(authorizationService.authorizeOperation).toHaveBeenCalledWith(
      testOperatingUserId,
      testFacilityId,
      testTeamId,
      expect.any(String),
    );
    expect(databaseAdapter.getAllocationPlanById).toHaveBeenCalledWith(testAllocationPlanId);
    expect(databaseAdapter.getWorkInstructionById).toHaveBeenCalledWith(testWorkInstructionId);
    expect(databaseAdapter.getFacilityById).toHaveBeenCalledWith(testFacilityId);
    expect(databaseAdapter.getTeamById).toHaveBeenCalledWith(testTeamId);
    expect(databaseAdapter.listWorkersByCondition).toHaveBeenCalled();
    expect(databaseAdapter.saveAllocationExecutionStatus).toHaveBeenCalled();
    expect(databaseAdapter.saveWorkInstructionReceptionHistory).toHaveBeenCalled();
    expect(databaseAdapter.recordOperationAudit).toHaveBeenCalled();

    // 利用可能なチャネルが取得されたことを確認
    expect(deliveryChannelAdapter.getAvailableChannels).toHaveBeenCalledWith(testFacilityId, testTeamId);

    // deliverAllocationInstructionToFieldLeaderが各チャネルで呼び出されたことを確認
    expect(deliveryChannelAdapter.deliverAllocationInstructionToFieldLeader).toHaveBeenCalledWith(
      testFacilityId,
      testTeamId,
      testFieldLeaderId,
      expect.objectContaining({ deliveryNotes: testDeliveryNotes }),
      'email',
    );
    expect(deliveryChannelAdapter.deliverAllocationInstructionToFieldLeader).toHaveBeenCalledWith(
      testFacilityId,
      testTeamId,
      testFieldLeaderId,
      expect.objectContaining({ deliveryNotes: testDeliveryNotes }),
      'app_notification',
    );
    expect(deliveryChannelAdapter.deliverAllocationInstructionToFieldLeader).toHaveBeenCalledWith(
      testFacilityId,
      testTeamId,
      testFieldLeaderId,
      expect.objectContaining({ deliveryNotes: testDeliveryNotes }),
      'sms',
    );
  });
});