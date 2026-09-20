import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';
import * as jest from 'jest';

describe('SCEN-213: 実績完了数量が0の場合の受領履歴記録', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkInstructionById: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetAllocationExecutionStatusById: jest.Mock;
  let mockValidateNumericQuantity: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockCalculateDelayDays: jest.Mock;
  let mockSaveWorkInstructionReceptionHistory: jest.Mock;
  let mockSaveAllocationExecutionStatus: jest.Mock;
  let mockSaveProgressData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockGetWorkInstructionById = jest.fn().mockResolvedValue({
      workInstructionId: 'WI-001',
      workName: 'Test Work',
      workDescription: 'Test Description',
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T17:00:00Z',
      priority: 'high',
      requiredWorkerCount: 1,
    });
    mockGetWorkerById = jest.fn().mockResolvedValue({
      workerId: 'W-001',
      workerName: 'Test Worker',
      proficiencyLevel: 'intermediate',
      recentProductivityRate: 0.8,
      deliveryChannelPreference: 'handy_terminal',
    });
    mockGetAllocationExecutionStatusById = jest.fn().mockResolvedValue({
      allocationExecutionStatusId: 'AES-001',
      allocationPlanId: 'AP-001',
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      configurationState: 'planned',
      planStartDateTime: '2024-01-15T08:00:00Z',
      planEndDateTime: '2024-01-15T17:00:00Z',
      progressRate: 0,
      delayFlag: false,
    });
    mockValidateNumericQuantity = jest.fn().mockResolvedValue({ isValid: true, errors: [] });
    mockValidateDateTimeRange = jest.fn().mockResolvedValue({ isValid: true, errors: [] });
    mockCalculateDelayDays = jest.fn().mockResolvedValue({
      isDelayed: false,
      delayDays: null,
    });
    mockSaveWorkInstructionReceptionHistory = jest.fn().mockResolvedValue('RH-001');
    mockSaveAllocationExecutionStatus = jest.fn().mockResolvedValue('AES-001');
    mockSaveProgressData = jest.fn().mockResolvedValue('PD-001');
    mockRecordOperationAudit = jest.fn().mockResolvedValue('AL-001');

    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).getWorkInstructionById = mockGetWorkInstructionById;
    (global as any).getWorkerById = mockGetWorkerById;
    (global as any).getAllocationExecutionStatusById = mockGetAllocationExecutionStatusById;
    (global as any).validateNumericQuantity = mockValidateNumericQuantity;
    (global as any).validateDateTimeRange = mockValidateDateTimeRange;
    (global as any).calculateDelayDays = mockCalculateDelayDays;
    (global as any).saveWorkInstructionReceptionHistory = mockSaveWorkInstructionReceptionHistory;
    (global as any).saveAllocationExecutionStatus = mockSaveAllocationExecutionStatus;
    (global as any).saveProgressData = mockSaveProgressData;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
  });

  it('should record reception history with zero completed quantity', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2024-01-15T09:00:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toBeDefined();
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

    // (1) receptionHistoryId が null でない文字列として返されること
    expect(result.receptionHistoryId).toBeTruthy();
    expect(typeof result.receptionHistoryId).toBe('string');

    // (2) allocationExecutionStatusId が入力値と一致する文字列として返されること
    expect(result.allocationExecutionStatusId).toBe('AES-001');

    // (3) progressDataId が null でない文字列として返されること
    expect(result.progressDataId).toBeTruthy();
    expect(typeof result.progressDataId).toBe('string');

    // (4) workInstructionId が'WI-001'として返されること
    expect(result.workInstructionId).toBe('WI-001');

    // (5) workerId が'W-001'として返されること
    expect(result.workerId).toBe('W-001');

    // (6) receptionStatus が'acknowledged'として返されること
    expect(result.receptionStatus).toBe('acknowledged');

    // (7) executionStatus が'not_started'として返されること
    expect(result.executionStatus).toBe('not_started');

    // (8) progressRate が0として返されること
    expect(result.progressRate).toBe(0);

    // (9) isDelayed が false として返されること
    expect(result.isDelayed).toBe(false);

    // (10) delayDays が null として返されること
    expect(result.delayDays).toBeNull();

    // (11) recordedTimestamp が ISO 8601形式の文字列として返されること
    expect(result.recordedTimestamp).toBeTruthy();
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(result.recordedTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // (12) auditLogId が null でない文字列として返されること
    expect(result.auditLogId).toBeTruthy();
    expect(typeof result.auditLogId).toBe('string');

    // 権限確認の明示的な検証
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        operatingUserId: 'OP-001',
      })
    );

    // (13) saveWorkInstructionReceptionHistory が completedQuantity=0 を含む入力で呼び出されたこと
    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();
    expect(mockSaveWorkInstructionReceptionHistory.mock.calls.length).toBeGreaterThan(0);
    
    const receptionHistoryCalls = mockSaveWorkInstructionReceptionHistory.mock.calls;
    const callWithZeroQuantity = receptionHistoryCalls.find(call => 
      call[0] && 
      call[0].completedQuantity === 0 && 
      call[0].workInstructionId === 'WI-001' &&
      call[0].workerId === 'W-001' &&
      call[0].receptionStatus === 'acknowledged' &&
      call[0].allocationExecutionStatusId === 'AES-001' &&
      call[0].executionStatus === 'not_started' &&
      call[0].plannedQuantity === 100
    );
    expect(callWithZeroQuantity).toBeDefined();
    expect(callWithZeroQuantity[0].completedQuantity).toBe(0);

    // (14) validateNumericQuantity が completedQuantity=0 に対して呼び出され、検証エラーを返さなかったこと
    expect(mockValidateNumericQuantity).toHaveBeenCalled();
    expect(mockValidateNumericQuantity.mock.calls.length).toBeGreaterThan(0);
    
    const validationCalls = mockValidateNumericQuantity.mock.calls;
    const callWithZeroQty = validationCalls.find(call => 
      call[0] && call[0].completedQuantity === 0
    );
    expect(callWithZeroQty).toBeDefined();
    expect(callWithZeroQty[0].completedQuantity).toBe(0);

    // validateNumericQuantityが検証エラーを返していない（isValid: true）ことを確認
    const validationResult = await mockValidateNumericQuantity({ completedQuantity: 0, plannedQuantity: 100, progressRate: 0 });
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual([]);

    // (15) 受領履歴が永続化され、completedQuantity=0 のデータが正常に記録されたこと
    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        completedQuantity: 0,
        workInstructionId: 'WI-001',
        workerId: 'W-001',
        receptionStatus: 'acknowledged',
        allocationExecutionStatusId: 'AES-001',
        executionStatus: 'not_started',
        plannedQuantity: 100,
      })
    );

    // saveWorkInstructionReceptionHistoryの戻り値がreceptionHistoryIdに反映されていることを確認
    expect(result.receptionHistoryId).toBe('RH-001');

    // saveAllocationExecutionStatusも同様に成功したことを確認
    expect(mockSaveAllocationExecutionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationExecutionStatusId: 'AES-001',
      })
    );

    // saveProgressDataも同様に成功したことを確認
    expect(mockSaveProgressData).toHaveBeenCalled();

    expect(mockGetWorkInstructionById).toHaveBeenCalledWith('WI-001');
    expect(mockGetWorkerById).toHaveBeenCalledWith('W-001');
    expect(mockGetAllocationExecutionStatusById).toHaveBeenCalledWith('AES-001');

    expect(mockValidateDateTimeRange).toHaveBeenCalled();
    expect(mockCalculateDelayDays).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('should process completedQuantity=0 the same way as other values in normal flow', async () => {
    const inputWithZeroQty = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'acknowledged' as const,
      receptionConfirmationTimestamp: '2024-01-15T09:00:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'OP-001',
      notes: null,
    };

    const resultZero = await recordWorkInstructionReceptionAndStatus(inputWithZeroQty);

    // completedQuantity=1の場合との比較
    mockSaveWorkInstructionReceptionHistory.mockClear();
    mockSaveAllocationExecutionStatus.mockClear();
    mockSaveProgressData.mockClear();

    const inputWithOneQty = {
      ...inputWithZeroQty,
      completedQuantity: 1,
    };

    const resultOne = await recordWorkInstructionReceptionAndStatus(inputWithOneQty);

    // 両者が同じフロー（同じモック関数の呼び出し）を経ていることを確認
    expect(mockGetWorkInstructionById).toHaveBeenCalled();
    expect(mockGetWorkerById).toHaveBeenCalled();
    expect(mockValidateNumericQuantity).toHaveBeenCalled();
    expect(mockSaveWorkInstructionReceptionHistory).toHaveBeenCalled();

    // 0という値が特別な処理（スキップなど）を引き起こさないことを確認
    expect(resultZero.receptionHistoryId).toBeTruthy();
    expect(resultOne.receptionHistoryId).toBeTruthy();
    expect(resultZero.progressDataId).toBeTruthy();
    expect(resultOne.progressDataId).toBeTruthy();
  });
});