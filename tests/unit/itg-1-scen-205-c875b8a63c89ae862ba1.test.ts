import { recordWorkInstructionReceptionAndStatus, AllocationExecutionStatusNotFoundError } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-205: エラー系：指定された人員配置実行状況IDが存在しないまたは削除済みの場合', () => {
  let createReceptionHistoryMock: jest.SpyInstance;
  let updateAllocationExecutionStatusMock: jest.SpyInstance;
  let createProgressDataMock: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(workInstructionDeliveryManager, 'getAllocationExecutionStatusById' as any).mockImplementation(
      async (id: string) => {
        if (id === 'AESS-NOT-EXIST') {
          return null;
        }
        return {
          allocationExecutionStatusId: id,
          allocationPlanId: 'AP-001',
          workInstructionId: 'WI-001',
          workerId: 'W-001',
          facilityId: 'F-001',
          teamId: 'T-001',
          allocationState: 'allocated',
          planStartDateTime: '2025-01-15T09:00:00Z',
          planEndDateTime: '2025-01-15T18:00:00Z',
          actualStartDateTime: null,
          actualEndDateTime: null,
          planWorkHours: 480,
          actualWorkHours: null,
          progressRate: 0,
          delayFlag: false,
          notes: null,
          createdAt: '2025-01-15T08:00:00Z',
          updatedAt: '2025-01-15T08:00:00Z',
          createdBy: 'ADMIN',
          updatedBy: 'ADMIN',
        };
      }
    );
    jest.spyOn(workInstructionDeliveryManager, 'getWorkInstructionById' as any).mockResolvedValue({
      workInstructionId: 'WI-001',
      workName: 'Sample Work',
      workDescription: 'Sample Description',
      plannedStartDateTime: '2025-01-15T09:00:00Z',
      plannedEndDateTime: '2025-01-15T18:00:00Z',
      priority: 'high',
      requiredWorkerCount: 1,
    });
    jest.spyOn(workInstructionDeliveryManager, 'getWorkerById' as any).mockResolvedValue({
      workerId: 'W-001',
      workerName: 'Sample Worker',
      proficiencyLevel: 'intermediate',
      recentProductivityRate: 0.85,
      deliveryChannelPreference: 'app_notification',
    });
    jest.spyOn(workInstructionDeliveryManager, 'authorizeOperation' as any).mockResolvedValue(true);
    jest.spyOn(workInstructionDeliveryManager, 'validateDateTimeRange' as any).mockResolvedValue(true);
    jest.spyOn(workInstructionDeliveryManager, 'validateNumericQuantity' as any).mockResolvedValue(true);
    createReceptionHistoryMock = jest.spyOn(workInstructionDeliveryManager, 'createReceptionHistory' as any).mockResolvedValue({
      receptionHistoryId: 'RH-001',
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      receptionDateTime: '2025-01-15T10:00:00Z',
      receptionConfirmationState: 'received',
      confirmationDateTime: null,
      deliveryMethod: 'app_notification',
      notes: null,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    });
    updateAllocationExecutionStatusMock = jest.spyOn(workInstructionDeliveryManager, 'updateAllocationExecutionStatus' as any).mockResolvedValue({});
    createProgressDataMock = jest.spyOn(workInstructionDeliveryManager, 'createProgressData' as any).mockResolvedValue({
      progressDataId: 'PD-001',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AllocationExecutionStatusNotFoundError が発生する', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AESS-NOT-EXIST',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2025-01-15T10:00:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'app_notification' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      AllocationExecutionStatusNotFoundError
    );
    await expect(recordWorkInstructionReceptionAndStatus(input)).rejects.toThrow(
      'Allocation execution status not found: AESS-NOT-EXIST'
    );

    expect(createReceptionHistoryMock).not.toHaveBeenCalled();
    expect(updateAllocationExecutionStatusMock).not.toHaveBeenCalled();
    expect(createProgressDataMock).not.toHaveBeenCalled();
  });
});