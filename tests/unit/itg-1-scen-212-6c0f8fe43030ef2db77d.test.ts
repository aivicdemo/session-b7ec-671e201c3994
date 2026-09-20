import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';
import { RecordWorkInstructionReceptionAndStatusInput, RecordWorkInstructionReceptionAndStatusOutput } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-212: 境界系：進捗率が上限の100の場合、受領履歴が正常に記録される', () => {
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
    jest.clearAllMocks();

    mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'WI-TEST-001',
      workName: 'Test Work',
      plannedEndDateTime: '2025-01-31T18:00:00Z',
    });

    mockGetWorkerById = jest.fn().mockResolvedValue({
      workerId: 'WR-001',
      workerName: 'Test Worker',
    });

    mockGetAllocationExecutionStatusById = jest.fn().mockResolvedValue({
      allocationExecutionStatusId: 'AES-001',
      配置状態: 'configured',
    });

    mockValidateDateTimeRange = jest.fn().mockResolvedValue({ valid: true });

    mockValidateNumericQuantity = jest.fn().mockResolvedValue({ valid: true });

    mockCalculateDelayDays = jest.fn().mockResolvedValue({
      isDelayed: false,
      delayDays: null,
    });

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    mockSaveWorkInstructionReceptionHistory = jest.fn().mockResolvedValue('RH-12345');

    mockSaveAllocationExecutionStatus = jest.fn().mockResolvedValue('AES-001');

    mockSaveProgressData = jest.fn().mockResolvedValue('PD-67890');

    mockRecordOperationAudit = jest.fn().mockResolvedValue('AL-99999');

    mockRecordWorkInstructionDeliveryHistory = jest.fn().mockResolvedValue({});

    (global as any).getWorkInstructionById = mockGetWorkInstructionById;
    (global as any).getWorkerById = mockGetWorkerById;
    (global as any).getAllocationExecutionStatusById = mockGetAllocationExecutionStatusById;
    (global as any).validateDateTimeRange = mockValidateDateTimeRange;
    (global as any).validateNumericQuantity = mockValidateNumericQuantity;
    (global as any).calculateDelayDays = mockCalculateDelayDays;
    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).saveWorkInstructionReceptionHistory = mockSaveWorkInstructionReceptionHistory;
    (global as any).saveAllocationExecutionStatus = mockSaveAllocationExecutionStatus;
    (global as any).saveProgressData = mockSaveProgressData;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
    (global as any).recordWorkInstructionDeliveryHistory = mockRecordWorkInstructionDeliveryHistory;
  });

  afterEach(() => {
    delete (global as any).getWorkInstructionById;
    delete (global as any).getWorkerById;
    delete (global as any).getAllocationExecutionStatusById;
    delete (global as any).validateDateTimeRange;
    delete (global as any).validateNumericQuantity;
    delete (global as any).calculateDelayDays;
    delete (global as any).authorizeOperation;
    delete (global as any).saveWorkInstructionReceptionHistory;
    delete (global as any).saveAllocationExecutionStatus;
    delete (global as any).saveProgressData;
    delete (global as any).recordOperationAudit;
    delete (global as any).recordWorkInstructionDeliveryHistory;
  });

  it('should successfully record reception history with progressRate=100', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-001',
      workerId: 'WR-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBe('RH-12345');
    expect(typeof result.receptionHistoryId).toBe('string');
    expect(result.allocationExecutionStatusId).toBe('AES-001');
    expect(typeof result.allocationExecutionStatusId).toBe('string');
    expect(result.progressDataId).toBe('PD-67890');
    expect(typeof result.progressDataId).toBe('string');
    expect(result.workInstructionId).toBe('WI-TEST-001');
    expect(result.workerId).toBe('WR-001');
    expect(result.receptionStatus).toBe('in_progress');
    expect(result.executionStatus).toBe('in_progress');
    expect(result.progressRate).toBe(100);
    expect(typeof result.progressRate).toBe('number');
    expect(result.progressRate).toBeGreaterThanOrEqual(0);
    expect(result.progressRate).toBeLessThanOrEqual(100);
    expect(result.isDelayed).toBe(false);
    expect(typeof result.isDelayed).toBe('boolean');
    expect(result.delayDays).toBeNull();
    expect(result.recordedTimestamp).toBeDefined();
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(result.recordedTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.auditLogId).toBe('AL-99999');
    expect(typeof result.auditLogId).toBe('string');

    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockValidateNumericQuantity).toHaveBeenCalled();
    expect(mockCalculateDelayDays).toHaveBeenCalled();
    expect(mockAuthorizeOperation).toHaveBeenCalled();
    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();
    expect(mockSaveAllocationExecutionStatus).toHaveBeenCalled();
    expect(mockSaveProgressData).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('should not raise ProgressDataValidationError for progressRate=100', async () => {
    mockValidateNumericQuantity.mockResolvedValue({ valid: true });

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-002',
      workerId: 'WR-002',
      allocationExecutionStatusId: 'AES-002',
      receptionStatus: 'completed',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'completed',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: '2025-01-31T17:30:00Z',
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.5,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toBeDefined();
    expect(result.progressRate).toBe(100);
    expect(result.receptionStatus).toBe('completed');
    expect(mockValidateNumericQuantity).toHaveBeenCalledWith(expect.objectContaining({ value: 100 }));
  });

  it('should correctly calculate no delay for progressRate=100 within planned end time', async () => {
    mockCalculateDelayDays.mockResolvedValue({
      isDelayed: false,
      delayDays: null,
    });

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-003',
      workerId: 'WR-003',
      allocationExecutionStatusId: 'AES-003',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
    expect(mockCalculateDelayDays).toHaveBeenCalled();
  });

  it('should persist all records and return complete output structure', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-004',
      workerId: 'WR-004',
      allocationExecutionStatusId: 'AES-004',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toHaveProperty('receptionHistoryId');
    expect(result).toHaveProperty('allocationExecutionStatusId');
    expect(result).toHaveProperty('progressDataId');
    expect(result).toHaveProperty('workInstructionId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('receptionStatus');
    expect(result).toHaveProperty('executionStatus');
    expect(result).toHaveProperty('progressRate');
    expect(result).toHaveProperty('isDelayed');
    expect(result).toHaveProperty('delayDays');
    expect(result).toHaveProperty('recordedTimestamp');
    expect(result).toHaveProperty('auditLogId');

    expect(typeof result.receptionHistoryId).toBe('string');
    expect(typeof result.allocationExecutionStatusId).toBe('string');
    expect(typeof result.progressDataId).toBe('string');
    expect(typeof result.isDelayed).toBe('boolean');
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(typeof result.auditLogId).toBe('string');

    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();
    expect(mockSaveAllocationExecutionStatus).toHaveBeenCalled();
    expect(mockSaveProgressData).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('should record progressRate=100 as valid upper bound value', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-005',
      workerId: 'WR-005',
      allocationExecutionStatusId: 'AES-005',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.progressRate).toStrictEqual(100);
    expect(result.progressRate).toBeGreaterThanOrEqual(0);
    expect(result.progressRate).toBeLessThanOrEqual(100);
  });

  it('should call getWorkInstructionById to retrieve instruction details', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-006',
      workerId: 'WR-006',
      allocationExecutionStatusId: 'AES-006',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    await recordWorkInstructionReceptionAndStatus(input);

    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI-TEST-006');
  });

  it('should call getWorkerById to verify worker exists', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-007',
      workerId: 'WR-007',
      allocationExecutionStatusId: 'AES-007',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    await recordWorkInstructionReceptionAndStatus(input);

    expect(mockGetWorkerById).toHaveBeenCalledWith('WR-007');
  });

  it('should call getAllocationExecutionStatusById to retrieve status details', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-008',
      workerId: 'WR-008',
      allocationExecutionStatusId: 'AES-008',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    await recordWorkInstructionReceptionAndStatus(input);

    expect(mockGetAllocationExecutionStatusById).toHaveBeenCalledWith('AES-008');
  });

  it('should call recordWorkInstructionDeliveryHistory after persistence', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-TEST-009',
      workerId: 'WR-009',
      allocationExecutionStatusId: 'AES-009',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2025-01-31T17:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2025-01-31T08:00:00Z',
      executionEndTimestamp: null,
      progressRate: 100,
      completedQuantity: 100,
      plannedQuantity: 100,
      plannedEndTimestamp: '2025-01-31T18:00:00Z',
      actualWorkHours: 9.0,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'OP-001',
      notes: null,
    };

    await recordWorkInstructionReceptionAndStatus(input);

    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalled();
  });
});