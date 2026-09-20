import { deliverAllocationInstructionToFieldLeader } from '../../src/logic/notification-external-integration';
import * as notificationModule from '../../src/logic/notification-external-integration';

class WorkInstructionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkInstructionNotFoundError';
    Object.setPrototypeOf(this, WorkInstructionNotFoundError.prototype);
  }
}

describe('SCEN-1165: 人員配置案に紐づく作業指示が存在しないとき、WorkInstructionNotFoundエラーで失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkInstructionNotFoundError when work instruction does not exist', async () => {
    const now = new Date('2024-01-15T10:30:00Z');
    const input = {
      allocationPlanId: 'plan-001',
      workInstructionId: 'wi-001',
      teamId: 'team-A',
      facilityId: 'fac-01',
      allocatedWorkerIds: ['worker-1', 'worker-2'],
      deliveryChannels: ['email', 'app_notification', 'handy_terminal'] as const,
      requestedByUserId: 'user-mgr-001',
      requestedAt: now,
    };

    const mockGetAllocationPlanById = jest
      .spyOn(notificationModule, 'getAllocationPlanById' as any)
      .mockResolvedValue({
        allocationPlanId: 'plan-001',
        status: 'approved',
        teamId: 'team-A',
        facilityId: 'fac-01',
        workInstructionId: 'wi-001',
        allocatedWorkerIds: ['worker-1', 'worker-2'],
      });

    const mockGetWorkInstructionById = jest
      .spyOn(notificationModule, 'getWorkInstructionById' as any)
      .mockRejectedValue(
        new WorkInstructionNotFoundError('作業指示が見つかりません。作業指示ID: wi-001')
      );

    const mockRecordWorkInstructionDeliveryHistory = jest.spyOn(
      notificationModule,
      'recordWorkInstructionDeliveryHistory' as any
    );
    const mockRecordHandyTerminalSyncLog = jest.spyOn(
      notificationModule,
      'recordHandyTerminalSyncLog' as any
    );
    const mockRecordWmsSyncLog = jest.spyOn(notificationModule, 'recordWmsSyncLog' as any);

    let thrownError: Error | null = null;
    try {
      await deliverAllocationInstructionToFieldLeader(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError).toBeInstanceOf(WorkInstructionNotFoundError);
    expect(thrownError?.name).toBe('WorkInstructionNotFoundError');
    expect(thrownError?.message).toBe(
      '作業指示が見つかりません。作業指示ID: wi-001'
    );

    expect(mockGetAllocationPlanById).toHaveBeenCalledWith('plan-001');
    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('wi-001');

    expect(mockRecordWorkInstructionDeliveryHistory).not.toHaveBeenCalled();
    expect(mockRecordHandyTerminalSyncLog).not.toHaveBeenCalled();
    expect(mockRecordWmsSyncLog).not.toHaveBeenCalled();

    mockGetAllocationPlanById.mockRestore();
    mockGetWorkInstructionById.mockRestore();
    mockRecordWorkInstructionDeliveryHistory.mockRestore();
    mockRecordHandyTerminalSyncLog.mockRestore();
    mockRecordWmsSyncLog.mockRestore();
  });
});