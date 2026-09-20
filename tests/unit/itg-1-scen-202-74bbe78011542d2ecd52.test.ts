import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

jest.mock('../../src/logic/work-instruction-delivery-manager', () => {
  const actual = jest.requireActual('../../src/logic/work-instruction-delivery-manager');
  return {
    ...actual,
    getWorkInstructionById: jest.fn(),
    getWorkerById: jest.fn(),
    getAllocationExecutionStatusById: jest.fn(),
    validateDateTimeRange: jest.fn(),
    validateNumericQuantity: jest.fn(),
    calculateDelayDays: jest.fn(),
    authorizeOperation: jest.fn(),
    saveWorkInstructionReceptionHistory: jest.fn(),
    saveAllocationExecutionStatus: jest.fn(),
    saveProgressData: jest.fn(),
    recordOperationAudit: jest.fn(),
    recordWorkInstructionDeliveryHistory: jest.fn(),
  };
});

describe('SCEN-202: recordWorkInstructionReceptionAndStatus - 正常系', () => {
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetAllocationExecutionStatusById: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockCalculateDelayDays: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockSaveWorkInstructionReceptionHistory: jest.Mock;
  let mockSaveAllocationExecutionStatus: jest.Mock;
  let mockSaveProgressData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockRecordWorkInstructionDeliveryHistory: jest.Mock;

  beforeEach(() => {
    mockGetWorkInstructionById = workInstructionDeliveryManager.getWorkInstructionById as jest.Mock;
    mockGetWorkerById = workInstructionDeliveryManager.getWorkerById as jest.Mock;
    mockGetAllocationExecutionStatusById = workInstructionDeliveryManager.getAllocationExecutionStatusById as jest.Mock;
    mockValidateDateTimeRange = workInstructionDeliveryManager.validateDateTimeRange as jest.Mock;
    mockValidateNumericQuantity = workInstructionDeliveryManager.validateNumericQuantity as jest.Mock;
    mockCalculateDelayDays = workInstructionDeliveryManager.calculateDelayDays as jest.Mock;
    mockAuthorizeOperation = workInstructionDeliveryManager.authorizeOperation as jest.Mock;
    mockSaveWorkInstructionReceptionHistory = workInstructionDeliveryManager.saveWorkInstructionReceptionHistory as jest.Mock;
    mockSaveAllocationExecutionStatus = workInstructionDeliveryManager.saveAllocationExecutionStatus as jest.Mock;
    mockSaveProgressData = workInstructionDeliveryManager.saveProgressData as jest.Mock;
    mockRecordOperationAudit = workInstructionDeliveryManager.recordOperationAudit as jest.Mock;
    mockRecordWorkInstructionDeliveryHistory = workInstructionDeliveryManager.recordWorkInstructionDeliveryHistory as jest.Mock;

    mockGetWorkInstructionById.mockResolvedValue({
      workInstructionId: 'WI-001',
      status: 'received',
      createdAt: '2024-01-15T00:00:00Z',
      facilityId: 'FAC-001',
      teamId: 'TM-001',
      plannedEndTimestamp: '2024-01-15T12:00:00Z',
    });

    mockGetWorkerById.mockResolvedValue({
      workerId: 'WR-001',
      workerName: 'Test Worker',
      proficiencyLevel: 'intermediate',
    });

    mockGetAllocationExecutionStatusById.mockResolvedValue({
      allocationExecutionStatusId: 'AES-001',
      status: 'pending',
      planStartDateTime: '2024-01-15T13:00:00Z',
      planEndDateTime: '2024-01-15T18:00:00Z',
    });

    mockValidateDateTimeRange.mockResolvedValue({
      isValid: true,
      validations: {
        receptionConfirmationAfterNow: true,
        executionStartAfterReception: true,
        executionEndAfterStart: true,
        allTimestampsBeforePlannedEnd: true,
      },
    });

    mockValidateNumericQuantity.mockResolvedValue({
      isValid: true,
      validations: {
        progressRateInRange: true,
        completedQuantityNonNegative: true,
        plannedQuantityNonNegative: true,
        completedNotExceedPlanned: true,
      },
    });

    mockCalculateDelayDays.mockReturnValue({
      delayDays: 0.083,
      isDelayed: true,
    });

    mockAuthorizeOperation.mockResolvedValue({
      authorized: true,
    });

    mockSaveWorkInstructionReceptionHistory.mockResolvedValue({
      receptionHistoryId: 'RH-12345',
    });

    mockSaveAllocationExecutionStatus.mockResolvedValue({
      allocationExecutionStatusId: 'AES-001',
    });

    mockSaveProgressData.mockResolvedValue({
      progressDataId: 'PD-67890',
    });

    mockRecordOperationAudit.mockResolvedValue({
      auditLogId: 'AL-11111',
    });

    mockRecordWorkInstructionDeliveryHistory.mockResolvedValue({
      deliveryHistoryId: 'DH-99999',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('全ての必須入力が妥当で、参照先エンティティが存在し、状態遷移が許可され、進捗データが有効な場合、受領履歴と実行状況が記録され、遅延判定を含む出力が返される', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'WR-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2024-01-15T14:00:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2024-01-15T13:55:00Z',
      executionEndTimestamp: null,
      progressRate: 50,
      completedQuantity: 500,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2024-01-15T12:00:00Z',
      actualWorkHours: 0.083,
      deliveryMethod: 'app_notification' as const,
      operatingUserId: 'OP-001',
      notes: '作業順調に進捗中',
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBe('RH-12345');
    expect(result.allocationExecutionStatusId).toBe('AES-001');
    expect(result.progressDataId).toBe('PD-67890');
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('WR-001');
    expect(result.receptionStatus).toBe('acknowledged');
    expect(result.executionStatus).toBe('in_progress');
    expect(result.progressRate).toBe(50);
    expect(result.isDelayed).toBe(true);
    expect(result.delayDays).toBe(0.083);
    expect(result.recordedTimestamp).toBeDefined();
    expect(typeof result.recordedTimestamp).toBe('string');
    const recordedDate = new Date(result.recordedTimestamp);
    expect(recordedDate.getTime()).toBeGreaterThan(0);
    expect(result.auditLogId).toBe('AL-11111');

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('OP-001');
    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI-001');
    expect(mockGetWorkerById).toHaveBeenCalledWith('WR-001');
    expect(mockGetAllocationExecutionStatusById).toHaveBeenCalledWith('AES-001');

    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(
      expect.objectContaining({
        receptionConfirmationTimestamp: '2024-01-15T14:00:00Z',
        executionStartTimestamp: '2024-01-15T13:55:00Z',
        executionEndTimestamp: null,
        plannedEndTimestamp: '2024-01-15T12:00:00Z',
      })
    );

    expect(mockValidateNumericQuantity).toHaveBeenCalledWith(
      expect.objectContaining({
        progressRate: 50,
        completedQuantity: 500,
        plannedQuantity: 1000,
      })
    );

    expect(mockCalculateDelayDays).toHaveBeenCalledWith({
      plannedEndTimestamp: '2024-01-15T12:00:00Z',
      receptionConfirmationTimestamp: '2024-01-15T14:00:00Z',
    });

    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();
    expect(mockSaveAllocationExecutionStatus).toHaveBeenCalled();
    expect(mockSaveProgressData).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        workInstructionId: 'WI-001',
        workerId: 'WR-001',
        deliveryMethod: 'app_notification',
        receptionConfirmationTimestamp: '2024-01-15T14:00:00Z',
        receptionHistoryId: 'RH-12345',
      })
    );

    expect(result.receptionHistoryId).toBeDefined();
    expect(result.allocationExecutionStatusId).toBeDefined();
    expect(result.progressDataId).toBeDefined();
    expect(result.workInstructionId).toBeDefined();
    expect(result.workerId).toBeDefined();
    expect(result.receptionStatus).toBeDefined();
    expect(result.executionStatus).toBeDefined();
    expect(result.progressRate).toBeDefined();
    expect(result.isDelayed).toBeDefined();
    expect(result.delayDays).toBeDefined();
    expect(result.recordedTimestamp).toBeDefined();
    expect(result.auditLogId).toBeDefined();
  });
});