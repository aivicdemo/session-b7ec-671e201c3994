import { deliverAllocationInstructionToFieldLeader, DeliverAllocationInstructionToFieldLeaderInput } from '../../src/logic/notification-external-integration';

// 内部の依存関数をモック化
jest.mock('../../src/infrastructure/db');
jest.mock('../../src/logic/record-delivery-history');
jest.mock('../../src/logic/record-handy-terminal-log');
jest.mock('../../src/logic/record-wms-log');

describe('SCEN-1169: 人員配置案に紐づく作業者割当情報が存在しないとき', () => {
  let mockGetAllocationPlanById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockRecordWorkInstructionDeliveryHistory: jest.Mock;
  let mockRecordHandyTerminalSyncLog: jest.Mock;
  let mockRecordWmsSyncLog: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // モック関数を取得
    const dbModule = require('../../src/infrastructure/db');
    const deliveryModule = require('../../src/logic/record-delivery-history');
    const handyTerminalModule = require('../../src/logic/record-handy-terminal-log');
    const wmsModule = require('../../src/logic/record-wms-log');

    mockGetAllocationPlanById = dbModule.getAllocationPlanById;
    mockGetWorkInstructionById = dbModule.getWorkInstructionById;
    mockGetTeamById = dbModule.getTeamById;
    mockListAllocationExecutionStatusByCondition = dbModule.listAllocationExecutionStatusByCondition;
    mockRecordWorkInstructionDeliveryHistory = deliveryModule.recordWorkInstructionDeliveryHistory;
    mockRecordHandyTerminalSyncLog = handyTerminalModule.recordHandyTerminalSyncLog;
    mockRecordWmsSyncLog = wmsModule.recordWmsSyncLog;
  });

  it('WorkerAllocationDataMissingエラーで失敗する', async () => {
    // テスト対象の入力値を準備
    const input: DeliverAllocationInstructionToFieldLeaderInput = {
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      teamId: 'team-001',
      facilityId: 'facility-001',
      allocatedWorkerIds: [],
      deliveryChannels: ['email', 'app_notification'],
      requestedByUserId: 'user-admin',
      requestedAt: new Date(),
    };

    // スタブの設定: 承認済み人員配置案
    mockGetAllocationPlanById.mockResolvedValue({
      id: 'plan-001',
      status: 'approved',
      teamId: 'team-001',
      facilityId: 'facility-001',
      allocationPlanName: 'Plan A',
      configurationStartDate: new Date(),
      predictedCompletionDate: new Date(),
      predictedWorkHours: 100,
    });

    // スタブの設定: 有効な作業指示
    mockGetWorkInstructionById.mockResolvedValue({
      id: 'instr-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionNumber: 'WI-001',
      taskName: 'Task 1',
      plannedStartDateTime: new Date(),
      plannedEndDateTime: new Date(),
      progressStatus: 'in_progress',
      requiredPersonnel: 3,
    });

    // スタブの設定: 有効なチーム
    mockGetTeamById.mockResolvedValue({
      id: 'team-001',
      teamName: 'Team A',
      facilityId: 'facility-001',
      teamLeaderId: 'lead-001',
      operatingStatus: 'active',
    });

    // スタブの設定: 作業者割当情報が存在しない（空配列）
    mockListAllocationExecutionStatusByCondition.mockResolvedValue([]);

    // テスト実行: エラーが発生することを確認
    let thrownError: Error | undefined;
    try {
      await deliverAllocationInstructionToFieldLeader(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // WorkerAllocationDataMissingエラーであることを確認（エラー型の検証）
    expect(thrownError).toBeDefined();
    expect(thrownError?.constructor.name).toBe('WorkerAllocationDataMissingError');

    // エラーメッセージが指定の配置案IDを含むことを確認
    expect(thrownError?.message).toContain('作業者割当情報が見つかりません');
    expect(thrownError?.message).toContain('plan-001');

    // recordWorkInstructionDeliveryHistory が呼ばれないことを確認
    expect(mockRecordWorkInstructionDeliveryHistory).not.toHaveBeenCalled();

    // recordHandyTerminalSyncLog が呼ばれないことを確認
    expect(mockRecordHandyTerminalSyncLog).not.toHaveBeenCalled();

    // recordWmsSyncLog が呼ばれないことを確認
    expect(mockRecordWmsSyncLog).not.toHaveBeenCalled();
  });
});