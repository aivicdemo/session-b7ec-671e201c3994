import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';
import type {
  RecordWorkInstructionReceptionAndStatusInput,
  RecordWorkInstructionReceptionAndStatusOutput,
} from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-219: 条件分岐：予定終了日時以内に完了した場合、isDelayedがfalseで返され、delayDaysがnullで返される', () => {
  it('should record work instruction reception and return isDelayed=false with delayDays=null when completed before planned end time', async () => {
    const input: RecordWorkInstructionReceptionAndStatusInput = {
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'completed',
      receptionConfirmationTimestamp: '2025-01-15T09:00:00Z',
      executionStatus: 'completed',
      executionStartTimestamp: '2025-01-15T08:00:00Z',
      executionEndTimestamp: '2025-01-15T16:30:00Z',
      progressRate: 100,
      completedQuantity: 500,
      plannedQuantity: 500,
      plannedEndTimestamp: '2025-01-15T17:00:00Z',
      actualWorkHours: 8.5,
      deliveryMethod: 'app_notification',
      operatingUserId: 'OP-001',
      notes: null,
    };

    const result: RecordWorkInstructionReceptionAndStatusOutput =
      await recordWorkInstructionReceptionAndStatus(input);

    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBeTruthy();
    expect(typeof result.receptionHistoryId).toBe('string');
    expect(result.allocationExecutionStatusId).toBe('AES-001');
    expect(result.progressDataId).toBeTruthy();
    expect(typeof result.progressDataId).toBe('string');
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('W-001');
    expect(result.receptionStatus).toBe('completed');
    expect(result.executionStatus).toBe('completed');
    expect(result.progressRate).toBe(100);
    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
    expect(result.recordedTimestamp).toBeTruthy();
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(result.auditLogId).toBeTruthy();
    expect(typeof result.auditLogId).toBe('string');
  });
});