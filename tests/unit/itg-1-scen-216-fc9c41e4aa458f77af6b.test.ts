import { recordWorkInstructionReceptionAndStatus, RecordWorkInstructionReceptionAndStatusInput } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

jest.mock('../../src/logic/work-instruction-delivery-manager', () => ({
  ...jest.requireActual('../../src/logic/work-instruction-delivery-manager'),
}));

describe('SCEN-216: 実行終了タイムスタンプがnullで実行状況がin_progressの場合、受領履歴が正常に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMocksForInput = (wiId: string, workerId: string, aesId: string, operatorId: string) => {
    const getWorkInstructionByIdSpy = jest.spyOn(workInstructionDeliveryManager as any, 'getWorkInstructionById')
      .mockResolvedValue({
        workInstructionId: wiId,
        workName: 'Test Work',
        workDescription: 'Test Description',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        priority: 'high',
        requiredWorkerCount: 5,
      });

    const getWorkerByIdSpy = jest.spyOn(workInstructionDeliveryManager as any, 'getWorkerById')
      .mockResolvedValue({
        workerId: workerId,
        workerName: 'Test Worker',
        proficiencyLevel: 'intermediate',
        recentProductivityRate: 0.85,
      });

    const getAllocationExecutionStatusByIdSpy = jest.spyOn(workInstructionDeliveryManager as any, 'getAllocationExecutionStatusById')
      .mockResolvedValue({
        allocationExecutionStatusId: aesId,
        allocationPlanId: 'plan-001',
        workInstructionId: wiId,
        workerId: workerId,
        configState: 'active',
        plannedStartDateTime: '2024-01-15T10:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
      });

    const authorizeOperationSpy = jest.spyOn(workInstructionDeliveryManager as any, 'authorizeOperation')
      .mockResolvedValue({ hasPermission: true });

    const validateDateTimeRangeSpy = jest.spyOn(workInstructionDeliveryManager as any, 'validateDateTimeRange')
      .mockResolvedValue({ isValid: true });

    const validateNumericQuantitySpy = jest.spyOn(workInstructionDeliveryManager as any, 'validateNumericQuantity')
      .mockResolvedValue({ isValid: true });

    const calculateDelayDaysSpy = jest.spyOn(workInstructionDeliveryManager as any, 'calculateDelayDays')
      .mockResolvedValue({ delayDays: null, isDelayed: false });

    const saveWorkInstructionReceptionHistorySpy = jest.spyOn(workInstructionDeliveryManager as any, 'saveWorkInstructionReceptionHistory')
      .mockResolvedValue({ receptionHistoryId: `rh-${wiId}-${Date.now()}` });

    const saveAllocationExecutionStatusSpy = jest.spyOn(workInstructionDeliveryManager as any, 'saveAllocationExecutionStatus')
      .mockResolvedValue({ allocationExecutionStatusId: aesId });

    const saveProgressDataSpy = jest.spyOn(workInstructionDeliveryManager as any, 'saveProgressData')
      .mockResolvedValue({ progressDataId: `pd-${wiId}-${Date.now()}` });

    const recordOperationAuditSpy = jest.spyOn(workInstructionDeliveryManager as any, 'recordOperationAudit')
      .mockResolvedValue({ auditLogId: `audit-${Date.now()}` });

    const recordWorkInstructionDeliveryHistorySpy = jest.spyOn(workInstructionDeliveryManager as any, 'recordWorkInstructionDeliveryHistory')
      .mockResolvedValue({});

    return {
      getWorkInstructionByIdSpy,
      getWorkerByIdSpy,
      getAllocationExecutionStatusByIdSpy,
      authorizeOperationSpy,
      validateDateTimeRangeSpy,
      validateNumericQuantitySpy,
      calculateDelayDaysSpy,
      saveWorkInstructionReceptionHistorySpy,
      saveAllocationExecutionStatusSpy,
      saveProgressDataSpy,
      recordOperationAuditSpy,
      recordWorkInstructionDeliveryHistorySpy,
    };
  };

  it('executionEndTimestampがnullで実行状況がin_progressの場合、受領履歴が正常に記録されること', async () => {
    const mocks = createMocksForInput('wi-001', 'worker-001', 'aes-001', 'operator-001');

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      allocationExecutionStatusId: 'aes-001',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2024-01-15T10:00:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'operator-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBeTruthy();
    expect(typeof result.receptionHistoryId).toBe('string');

    expect(result.allocationExecutionStatusId).toBe('aes-001');

    expect(result.progressDataId).toBeTruthy();
    expect(typeof result.progressDataId).toBe('string');

    expect(result.workInstructionId).toBe('wi-001');
    expect(result.workerId).toBe('worker-001');
    expect(result.receptionStatus).toBe('in_progress');
    expect(result.executionStatus).toBe('in_progress');
    expect(result.progressRate).toBe(45);

    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();

    expect(result.recordedTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);
    const timestamp = new Date(result.recordedTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);

    expect(result.auditLogId).toBeTruthy();
    expect(typeof result.auditLogId).toBe('string');

    expect(mocks.getWorkInstructionByIdSpy).toHaveBeenCalledWith('wi-001');
    expect(mocks.getWorkerByIdSpy).toHaveBeenCalledWith('worker-001');
    expect(mocks.getAllocationExecutionStatusByIdSpy).toHaveBeenCalledWith('aes-001');
    expect(mocks.authorizeOperationSpy).toHaveBeenCalledWith('operator-001');
    expect(mocks.validateDateTimeRangeSpy).toHaveBeenCalled();
    expect(mocks.validateNumericQuantitySpy).toHaveBeenCalled();
    expect(mocks.calculateDelayDaysSpy).toHaveBeenCalled();
    expect(mocks.saveWorkInstructionReceptionHistorySpy).toHaveBeenCalled();
    expect(mocks.saveAllocationExecutionStatusSpy).toHaveBeenCalled();
    expect(mocks.saveProgressDataSpy).toHaveBeenCalled();
    expect(mocks.recordOperationAuditSpy).toHaveBeenCalled();
    expect(mocks.recordWorkInstructionDeliveryHistorySpy).toHaveBeenCalled();
  });

  it('executionEndTimestampがnullで実行中の境界条件下でも遅延判定が正確に計算されること', async () => {
    const mocks = createMocksForInput('wi-002', 'worker-002', 'aes-002', 'operator-002');

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'wi-002',
      workerId: 'worker-002',
      allocationExecutionStatusId: 'aes-002',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2024-01-15T10:00:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'operator-002',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();

    expect(mocks.calculateDelayDaysSpy).toHaveBeenCalled();
  });

  it('受領履歴と配置実行状況が永続化されること', async () => {
    const mocks = createMocksForInput('wi-003', 'worker-003', 'aes-003', 'operator-003');

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'wi-003',
      workerId: 'worker-003',
      allocationExecutionStatusId: 'aes-003',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2024-01-15T10:00:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'operator-003',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.receptionHistoryId).toBeTruthy();
    expect(result.allocationExecutionStatusId).toBe('aes-003');
    expect(result.progressDataId).toBeTruthy();
    expect(result.workInstructionId).toBe('wi-003');
    expect(result.workerId).toBe('worker-003');
    expect(result.receptionStatus).toBe('in_progress');

    expect(mocks.saveWorkInstructionReceptionHistorySpy).toHaveBeenCalled();
    expect(mocks.saveAllocationExecutionStatusSpy).toHaveBeenCalled();
    expect(mocks.saveProgressDataSpy).toHaveBeenCalled();
  });

  it('recordedTimestampがISO 8601形式の有効な日時文字列であること', async () => {
    const mocks = createMocksForInput('wi-004', 'worker-004', 'aes-004', 'operator-004');

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'wi-004',
      workerId: 'worker-004',
      allocationExecutionStatusId: 'aes-004',
      receptionStatus: 'in_progress',
      receptionConfirmationTimestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2024-01-15T10:00:00Z',
      executionEndTimestamp: null,
      progressRate: 45,
      completedQuantity: 450,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal',
      operatingUserId: 'operator-004',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(result.recordedTimestamp).toMatch(iso8601Regex);

    const timestamp = new Date(result.recordedTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });

  it('出力型の全フィールドが仕様の型に合致すること', async () => {
    const mocks = createMocksForInput('wi-005', 'worker-005', 'aes-005', 'operator-005');

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'wi-005',
      workerId: 'worker-005',
      allocationExecutionStatusId: 'aes-005',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: '2024-01-15T11:00:00Z',
      executionStatus: 'in_progress',
      executionStartTimestamp: '2024-01-15T10:30:00Z',
      executionEndTimestamp: null,
      progressRate: 60,
      completedQuantity: 600,
      plannedQuantity: 1000,
      plannedEndTimestamp: '2024-01-15T18:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'email',
      operatingUserId: 'operator-005',
      notes: '進捗順調',
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(typeof result.receptionHistoryId).toBe('string');
    expect(typeof result.allocationExecutionStatusId).toBe('string');
    expect(typeof result.progressDataId).toBe('string');
    expect(typeof result.workInstructionId).toBe('string');
    expect(typeof result.workerId).toBe('string');
    expect(['received', 'acknowledged', 'in_progress', 'completed', 'cancelled']).toContain(result.receptionStatus);
    expect(['not_started', 'in_progress', 'paused', 'completed', 'failed']).toContain(result.executionStatus);
    expect(typeof result.progressRate).toBe('number');
    expect(result.progressRate).toBeGreaterThanOrEqual(0);
    expect(result.progressRate).toBeLessThanOrEqual(100);
    expect(typeof result.isDelayed).toBe('boolean');
    expect(result.delayDays === null || typeof result.delayDays === 'number').toBe(true);
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(typeof result.auditLogId).toBe('string');

    expect(mocks.getWorkInstructionByIdSpy).toHaveBeenCalledWith('wi-005');
    expect(mocks.getWorkerByIdSpy).toHaveBeenCalledWith('worker-005');
    expect(mocks.getAllocationExecutionStatusByIdSpy).toHaveBeenCalledWith('aes-005');
    expect(mocks.authorizeOperationSpy).toHaveBeenCalledWith('operator-005');
  });
});