import {
  recordWorkInstructionReceptionAndStatus,
  RecordWorkInstructionReceptionAndStatusInput,
  RecordWorkInstructionReceptionAndStatusOutput,
} from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-215: recordWorkInstructionReceptionAndStatus with null executionStartTimestamp and not_started status', () => {
  it('should successfully record reception history with null executionStartTimestamp and not_started status', async () => {
    const now = new Date().toISOString();
    const plannedEndTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'work-001',
      workerId: 'worker-001',
      allocationExecutionStatusId: 'alloc-exec-001',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: now,
      executionStatus: 'not_started',
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: plannedEndTimestamp,
      deliveryMethod: 'app_notification',
      operatingUserId: 'operator-001',
      actualWorkHours: null,
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.receptionHistoryId).toBeTruthy();
    expect(result.receptionHistoryId).not.toBeNull();
    expect(result.allocationExecutionStatusId).toBe('alloc-exec-001');
    expect(result.progressDataId).toBeTruthy();
    expect(result.progressDataId).not.toBeNull();
    expect(result.workInstructionId).toBe('work-001');
    expect(result.workerId).toBe('worker-001');
    expect(result.receptionStatus).toBe('acknowledged');
    expect(result.executionStatus).toBe('not_started');
    expect(result.progressRate).toBe(0);
    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
    expect(result.recordedTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
    expect(result.auditLogId).toBeTruthy();
    expect(result.auditLogId).not.toBeNull();
  });

  it('should verify executionStartTimestamp is null when executionStatus is not_started', async () => {
    const now = new Date().toISOString();
    const plannedEndTimestamp = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'work-002',
      workerId: 'worker-002',
      allocationExecutionStatusId: 'alloc-exec-002',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: now,
      executionStatus: 'not_started',
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 50,
      plannedEndTimestamp: plannedEndTimestamp,
      deliveryMethod: 'email',
      operatingUserId: 'operator-002',
      actualWorkHours: null,
      notes: null,
    };

    expect(input.executionStartTimestamp).toBeNull();

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.executionStatus).toBe('not_started');
    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
  });

  it('should verify reception status transitions from received to acknowledged', async () => {
    const now = new Date().toISOString();
    const plannedEndTimestamp = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'work-003',
      workerId: 'worker-003',
      allocationExecutionStatusId: 'alloc-exec-003',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: now,
      executionStatus: 'not_started',
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 75,
      plannedEndTimestamp: plannedEndTimestamp,
      deliveryMethod: 'sms',
      operatingUserId: 'operator-003',
      actualWorkHours: null,
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.receptionStatus).toBe('acknowledged');
    expect(result.receptionStatus).not.toBe('received');
  });

  it('should verify progressRate is 0 and within valid range', async () => {
    const now = new Date().toISOString();
    const plannedEndTimestamp = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'work-004',
      workerId: 'worker-004',
      allocationExecutionStatusId: 'alloc-exec-004',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: now,
      executionStatus: 'not_started',
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: plannedEndTimestamp,
      deliveryMethod: 'app_notification',
      operatingUserId: 'operator-004',
      actualWorkHours: null,
      notes: null,
    };

    expect(input.progressRate).toBeGreaterThanOrEqual(0);
    expect(input.progressRate).toBeLessThanOrEqual(100);
    expect(input.completedQuantity).toBeGreaterThanOrEqual(0);

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.progressRate).toBe(0);
  });

  it('should verify receptionConfirmationTimestamp is in valid ISO 8601 format', async () => {
    const now = new Date().toISOString();
    const plannedEndTimestamp = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'work-005',
      workerId: 'worker-005',
      allocationExecutionStatusId: 'alloc-exec-005',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: now,
      executionStatus: 'not_started',
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: plannedEndTimestamp,
      deliveryMethod: 'app_notification',
      operatingUserId: 'operator-005',
      actualWorkHours: null,
      notes: null,
    };

    expect(input.receptionConfirmationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.recordedTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it('should return null delayDays when completedQuantity < plannedQuantity and status is not_started', async () => {
    const now = new Date().toISOString();
    const plannedEndTimestamp = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'work-006',
      workerId: 'worker-006',
      allocationExecutionStatusId: 'alloc-exec-006',
      receptionStatus: 'acknowledged',
      receptionConfirmationTimestamp: now,
      executionStatus: 'not_started',
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: plannedEndTimestamp,
      deliveryMethod: 'app_notification',
      operatingUserId: 'operator-006',
      actualWorkHours: null,
      notes: null,
    };

    expect(input.completedQuantity).toBeLessThan(input.plannedQuantity);

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
  });
});