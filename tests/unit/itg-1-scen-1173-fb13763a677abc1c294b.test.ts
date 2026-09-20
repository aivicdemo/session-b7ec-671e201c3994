import { deliverAllocationInstructionToFieldLeader } from '../../src/logic/notification-external-integration';

describe('SCEN-1173: 複数の配信チャネルが指定されたとき、指定されたすべてのチャネルで配信を試行し、各チャネルの成功・失敗を個別に記録して返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('すべてのチャネルで配信が成功した場合、各チャネルの成功状況を個別に記録して返す', async () => {
    const input = {
      allocationPlanId: 'AP-001',
      workInstructionId: 'WI-001',
      teamId: 'TEAM-A',
      facilityId: 'FAC-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      deliveryChannels: ['email', 'app_notification', 'handy_terminal'],
      requestedByUserId: 'U-admin',
      requestedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const result = await deliverAllocationInstructionToFieldLeader(input);

    expect(result.success).toBe(true);
    expect(result.allocationPlanId).toBe('AP-001');
    expect(result.deliveredChannels).toEqual(['email', 'app_notification', 'handy_terminal']);
    expect(result.deliveredChannels).toHaveLength(3);

    expect(result.fieldLeaderDeliveryStatus).toHaveLength(3);
    expect(result.fieldLeaderDeliveryStatus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          channel: 'email',
          status: 'success',
          deliveredAt: new Date('2024-01-15T10:00:00Z'),
        }),
        expect.objectContaining({
          channel: 'app_notification',
          status: 'success',
          deliveredAt: new Date('2024-01-15T10:00:01Z'),
        }),
        expect.objectContaining({
          channel: 'handy_terminal',
          status: 'success',
          deliveredAt: new Date('2024-01-15T10:00:02Z'),
        }),
      ]),
    );

    expect(result.workerDeliveryStatus).toHaveLength(9);
    result.workerDeliveryStatus.forEach((status) => {
      expect(status.status).toBe('success');
      expect(['W001', 'W002', 'W003']).toContain(status.workerId);
      expect(['email', 'app_notification', 'handy_terminal']).toContain(status.channel);
      expect(status.deliveredAt).toBeInstanceOf(Date);
    });

    const emailStatuses = result.workerDeliveryStatus.filter((s) => s.channel === 'email');
    emailStatuses.forEach((s) => {
      expect(s.deliveredAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });

    const appStatuses = result.workerDeliveryStatus.filter((s) => s.channel === 'app_notification');
    appStatuses.forEach((s) => {
      expect(s.deliveredAt).toEqual(new Date('2024-01-15T10:00:01Z'));
    });

    const handyStatuses = result.workerDeliveryStatus.filter((s) => s.channel === 'handy_terminal');
    handyStatuses.forEach((s) => {
      expect(s.deliveredAt).toEqual(new Date('2024-01-15T10:00:02Z'));
    });

    expect(result.deliveryHistoryIds).toHaveLength(3);
    expect(result.deliveryHistoryIds).toEqual(
      expect.arrayContaining([expect.any(String), expect.any(String), expect.any(String)]),
    );

    expect(result.failureReason).toBeNull();
  });
});