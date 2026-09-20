import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-214: 実績作業時間がnullの場合の受領履歴記録', () => {
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetAllocationExecutionStatusById: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockCalculateDelayDays: jest.Mock;
  let mockSaveWorkInstructionReceptionHistory: jest.Mock;
  let mockSaveAllocationExecutionStatus: jest.Mock;
  let mockSaveProgressData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'WI-001',
      workName: 'Test Work',
      workDescription: 'Test Description',
      plannedEndDateTime: '2025-01-15T17:00:00Z',
    });

    mockGetWorkerById = jest.fn().mockResolvedValue({
      workerId: 'W-001',
      workerName: 'Test Worker',
    });

    mockGetAllocationExecutionStatusById = jest.fn().mockResolvedValue({
      allocationExecutionStatusId: 'AES-001',
      allocationPlanId: 'AP-001',
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      configurationState: '配置済',
    });

    mockValidateDateTimeRange = jest.fn().mockResolvedValue(true);
    mockValidateNumericQuantity = jest.fn().mockResolvedValue(true);

    mockCalculateDelayDays = jest.fn().mockResolvedValue({
      isDelayed: false,
      delayDays: null,
    });

    mockSaveWorkInstructionReceptionHistory = jest.fn().mockResolvedValue('RH-20250115-001');
    mockSaveAllocationExecutionStatus = jest.fn().mockResolvedValue('AES-001');
    mockSaveProgressData = jest.fn().mockResolvedValue('PD-20250115-001');
    mockRecordOperationAudit = jest.fn().mockResolvedValue('AL-20250115-001');
    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    jest.spyOn(global as any, 'getWorkInstructionById').mockImplementation(mockGetWorkInstructionById);
    jest.spyOn(global as any, 'getWorkerById').mockImplementation(mockGetWorkerById);
    jest.spyOn(global as any, 'getAllocationExecutionStatusById').mockImplementation(mockGetAllocationExecutionStatusById);
    jest.spyOn(global as any, 'validateDateTimeRange').mockImplementation(mockValidateDateTimeRange);
    jest.spyOn(global as any, 'validateNumericQuantity').mockImplementation(mockValidateNumericQuantity);
    jest.spyOn(global as any, 'calculateDelayDays').mockImplementation(mockCalculateDelayDays);
    jest.spyOn(global as any, 'saveWorkInstructionReceptionHistory').mockImplementation(mockSaveWorkInstructionReceptionHistory);
    jest.spyOn(global as any, 'saveAllocationExecutionStatus').mockImplementation(mockSaveAllocationExecutionStatus);
    jest.spyOn(global as any, 'saveProgressData').mockImplementation(mockSaveProgressData);
    jest.spyOn(global as any, 'recordOperationAudit').mockImplementation(mockRecordOperationAudit);
    jest.spyOn(global as any, 'authorizeOperation').mockImplementation(mockAuthorizeOperation);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should record reception history successfully when actualWorkHours is null', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2025-01-15T09:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2025-01-15T09:35:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.receptionHistoryId).toBe('RH-20250115-001');
    expect(result.allocationExecutionStatusId).toBe('AES-001');
    expect(result.progressDataId).toBe('PD-20250115-001');
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('W-001');
    expect(result.receptionStatus).toBe('acknowledged');
    expect(result.executionStatus).toBe('in_progress');
    expect(result.progressRate).toBe(45);
    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
    expect(result.auditLogId).toBe('AL-20250115-001');
  });

  it('should call saveWorkInstructionReceptionHistory with actualWorkHours as null', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2025-01-15T09:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2025-01-15T09:35:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    await recordWorkInstructionReceptionAndStatus(input);

    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();
    const callArgs = mockSaveWorkInstructionReceptionHistory.mock.calls[0][0];
    expect(callArgs.actualWorkHours).toBeNull();
  });

  it('should call saveProgressData and mark actualWorkHours as excluded from productivity calculation', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2025-01-15T09:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2025-01-15T09:35:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    await recordWorkInstructionReceptionAndStatus(input);

    expect(mockSaveProgressData).toHaveBeenCalled();
    const callArgs = mockSaveProgressData.mock.calls[0][0];
    expect(callArgs.actualWorkHours).toBeNull();
  });

  it('should return valid recordedTimestamp in ISO 8601 format', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2025-01-15T09:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2025-01-15T09:35:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.recordedTimestamp).toBeDefined();
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.recordedTimestamp)).toBe(true);
  });

  it('should persist reception history with null actualWorkHours without impediment', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2025-01-15T09:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2025-01-15T09:35:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.receptionHistoryId).not.toBeNull();
    expect(result.receptionHistoryId).toBe('RH-20250115-001');
    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();
  });

  it('should exclude null actualWorkHours from productivity calculation', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2025-01-15T09:30:00Z',
      executionStatus: 'in_progress' as const,
      executionStartTimestamp: '2025-01-15T09:35:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(mockSaveProgressData).toHaveBeenCalled();
    const progressDataCall = mockSaveProgressData.mock.calls[0][0];
    expect(progressDataCall.actualWorkHours).toBeNull();
    expect(result.progressDataId).toBe('PD-20250115-001');
  });
});