import { deliverAllocationInstructionToFieldLeader } from '../../src/logic/notification-external-integration';

describe('SCEN-1174: 配信対象者の一部の配信が失敗したとき、成功した対象者と失敗した対象者の両方のステータスを記録して返す', () => {
  let mockGetAllocationPlanById: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockListAllocationExecutionStatusByCondition: jest.Mock;
  let mockGetTeamLeaderByTeamId: jest.Mock;
  let mockNotificationServiceAdapter: jest.Mock;
  let mockRecordWorkInstructionDeliveryHistory: jest.Mock;
  let mockRecordHandyTerminalSyncLog: jest.Mock;
  let mockRecordWmsSyncLog: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllocationPlanById = jest.fn().mockResolvedValue({
      allocationPlanId: 'PLAN-001',
      status: 'approved',
      teamId: 'TEAM-A',
      facilityId: 'FAC-001',
    });

    mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'INSTR-001',
      allocationPlanId: 'PLAN-001',
      instructions: '配置案が確定しました',
    });

    mockGetTeamById = jest.fn().mockResolvedValue({
      teamId: 'TEAM-A',
      teamName: 'Team A',
      teamLeaderId: 'LEADER-001',
    });

    mockGetWorkerById = jest.fn().mockImplementation((workerId: string) => {
      const workers: Record<string, unknown> = {
        W001: { workerId: 'W001', name: 'Worker 1', email: 'w001@example.com' },
        W002: { workerId: 'W002', name: 'Worker 2', email: 'w002@example.com' },
        W003: { workerId: 'W003', name: 'Worker 3', email: 'w003@example.com' },
      };
      return Promise.resolve(workers[workerId]);
    });

    mockGetTeamLeaderByTeamId = jest.fn().mockResolvedValue({
      userId: 'LEADER-001',
      name: 'Team Leader',
      email: 'leader@example.com',
    });

    mockListAllocationExecutionStatusByCondition = jest.fn().mockResolvedValue([
      { workerId: 'W001', status: 'allocated' },
      { workerId: 'W002', status: 'allocated' },
      { workerId: 'W003', status: 'allocated' },
    ]);

    mockRecordWorkInstructionDeliveryHistory = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        success: true,
        receptionHistoryId: `HIST-${Math.random().toString(36).substr(2, 9)}`,
      });
    });

    mockRecordHandyTerminalSyncLog = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        success: true,
        handyTerminalSyncLogId: `SYNC-${Math.random().toString(36).substr(2, 9)}`,
      });
    });

    mockRecordWmsSyncLog = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        success: true,
        wmsSyncLogId: `WMS-${Math.random().toString(36).substr(2, 9)}`,
      });
    });

    mockNotificationServiceAdapter = jest.fn().mockImplementation(
      (channel: string, recipientId: string, _deliveryData: unknown) => {
        // Worker deliveries
        if (channel === 'email' && recipientId === 'W001') {
          return Promise.resolve({
            success: true,
            channel: 'email',
            recipientId: 'W001',
            deliveredAt: new Date('2024-01-15T10:00:01Z'),
          });
        }
        if (channel === 'app_notification' && recipientId === 'W002') {
          return Promise.resolve({
            success: true,
            channel: 'app_notification',
            recipientId: 'W002',
            deliveredAt: new Date('2024-01-15T10:00:02Z'),
          });
        }
        if (channel === 'handy_terminal' && recipientId === 'W003') {
          return Promise.resolve({
            success: false,
            channel: 'handy_terminal',
            recipientId: 'W003',
            deliveredAt: null,
            error: 'Device offline',
          });
        }
        // Field leader deliveries
        if (channel === 'email' && recipientId === 'LEADER-001') {
          return Promise.resolve({
            success: true,
            channel: 'email',
            recipientId: 'LEADER-001',
            deliveredAt: new Date('2024-01-15T10:00:03Z'),
          });
        }
        if (channel === 'app_notification' && recipientId === 'LEADER-001') {
          return Promise.resolve({
            success: false,
            channel: 'app_notification',
            recipientId: 'LEADER-001',
            deliveredAt: null,
            error: 'Notification service unavailable',
          });
        }
        if (channel === 'handy_terminal' && recipientId === 'LEADER-001') {
          return Promise.resolve({
            success: true,
            channel: 'handy_terminal',
            recipientId: 'LEADER-001',
            deliveredAt: new Date('2024-01-15T10:00:04Z'),
          });
        }
        return Promise.resolve({
          success: false,
          channel,
          recipientId,
          deliveredAt: null,
          error: 'Unknown error',
        });
      }
    );

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => new Date('2024-01-15T10:00:00Z') as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('配信対象者の一部の配信が失敗したとき、成功した対象者と失敗した対象者の両方のステータスを記録して返す', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      workInstructionId: 'INSTR-001',
      teamId: 'TEAM-A',
      facilityId: 'FAC-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      deliveryChannels: ['email', 'app_notification', 'handy_terminal'] as const,
      requestedByUserId: 'USER-001',
      requestedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const output = await deliverAllocationInstructionToFieldLeader(input);

    expect(output.success).toBe(false);
    expect(output.allocationPlanId).toBe('PLAN-001');
    expect(output.deliveredChannels).toContain('email');
    expect(output.deliveredChannels).toContain('app_notification');
    expect(output.deliveredChannels).toContain('handy_terminal');

    // Verify worker delivery statuses
    expect(output.workerDeliveryStatus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workerId: 'W001',
          channel: 'email',
          status: 'success',
          deliveredAt: expect.any(Date),
        }),
        expect.objectContaining({
          workerId: 'W002',
          channel: 'app_notification',
          status: 'success',
          deliveredAt: expect.any(Date),
        }),
        expect.objectContaining({
          workerId: 'W003',
          channel: 'handy_terminal',
          status: 'failed',
          deliveredAt: null,
        }),
      ])
    );

    const w001Status = output.workerDeliveryStatus.find(
      (s) => s.workerId === 'W001' && s.channel === 'email'
    );
    expect(w001Status?.status).toBe('success');
    expect(w001Status?.deliveredAt?.getTime()).toBe(
      new Date('2024-01-15T10:00:01Z').getTime()
    );

    const w002Status = output.workerDeliveryStatus.find(
      (s) => s.workerId === 'W002' && s.channel === 'app_notification'
    );
    expect(w002Status?.status).toBe('success');
    expect(w002Status?.deliveredAt?.getTime()).toBe(
      new Date('2024-01-15T10:00:02Z').getTime()
    );

    const w003Status = output.workerDeliveryStatus.find(
      (s) => s.workerId === 'W003' && s.channel === 'handy_terminal'
    );
    expect(w003Status?.status).toBe('failed');
    expect(w003Status?.deliveredAt).toBeNull();

    // Verify field leader delivery statuses
    expect(output.fieldLeaderDeliveryStatus).toBeDefined();
    expect(Array.isArray(output.fieldLeaderDeliveryStatus)).toBe(true);

    const leaderEmailStatus = output.fieldLeaderDeliveryStatus.find(
      (s) => s.channel === 'email'
    );
    expect(leaderEmailStatus).toEqual(
      expect.objectContaining({
        userId: 'LEADER-001',
        channel: 'email',
        status: 'success',
        deliveredAt: expect.any(Date),
      })
    );
    expect(leaderEmailStatus?.deliveredAt?.getTime()).toBe(
      new Date('2024-01-15T10:00:03Z').getTime()
    );

    const leaderAppNotifStatus = output.fieldLeaderDeliveryStatus.find(
      (s) => s.channel === 'app_notification'
    );
    expect(leaderAppNotifStatus).toEqual(
      expect.objectContaining({
        userId: 'LEADER-001',
        channel: 'app_notification',
        status: 'failed',
        deliveredAt: null,
      })
    );

    const leaderHandyTerminalStatus = output.fieldLeaderDeliveryStatus.find(
      (s) => s.channel === 'handy_terminal'
    );
    expect(leaderHandyTerminalStatus).toEqual(
      expect.objectContaining({
        userId: 'LEADER-001',
        channel: 'handy_terminal',
        status: 'success',
        deliveredAt: expect.any(Date),
      })
    );
    expect(leaderHandyTerminalStatus?.deliveredAt?.getTime()).toBe(
      new Date('2024-01-15T10:00:04Z').getTime()
    );

    // Verify delivery history IDs
    expect(output.deliveryHistoryIds).toBeDefined();
    expect(Array.isArray(output.deliveryHistoryIds)).toBe(true);
    expect(output.deliveryHistoryIds.length).toBeGreaterThan(0);

    // Verify failureReason indicates both success and failure statuses
    expect(output.failureReason).toBeDefined();
    expect(typeof output.failureReason).toBe('string');
    expect(output.failureReason.length).toBeGreaterThan(0);
    expect(output.failureReason).toMatch(
      /(?=.*成功)(?=.*失敗)|(?=.*success)(?=.*failed)|(?=.*一部)/i
    );
  });
});