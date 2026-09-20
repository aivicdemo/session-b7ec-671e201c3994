import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1063: ハンディターミナル連携ログの新規作成', () => {
  it('新規ログレコード作成時に必須フィールドが全て揃っていれば、新規IDを自動採番してログを永続化し、作成フラグtrue・保存日時を返す', async () => {
    const input = {
      handyTerminalSyncLogId: null,
      workerId: 'W001',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'work_result',
      workInstructionId: null,
      syncContent: '{"completed_count":50}',
      syncStatus: 'success',
      errorMessage: null,
      sentDateTime: '2024-01-15T10:30:00Z',
      receivedDateTime: '2024-01-15T10:30:05Z',
      processingCompletedDateTime: '2024-01-15T10:30:10Z',
      retryCount: null,
      createdBy: 'ADMIN001',
      updatedBy: null,
    };

    const result = await saveHandyTerminalSyncLog(input);

    expect(result.handyTerminalSyncLogId).toBeDefined();
    expect(result.handyTerminalSyncLogId).not.toBeNull();
    expect(typeof result.handyTerminalSyncLogId).toBe('string');
    expect(result.handyTerminalSyncLogId).not.toBe(input.handyTerminalSyncLogId);

    expect(result.workerId).toBe('W001');
    expect(result.handyTerminalId).toBe('HT001');
    expect(result.facilityId).toBe('F001');
    expect(result.syncType).toBe('work_result');
    expect(result.syncStatus).toBe('success');

    expect(result.isNewRecord).toBe(true);

    expect(result.savedAt).toBeDefined();
    const savedAtDate = new Date(result.savedAt);
    const processingDate = new Date('2024-01-15T10:30:10Z');
    const timeDiffMs = Math.abs(savedAtDate.getTime() - processingDate.getTime());
    expect(timeDiffMs).toBeLessThanOrEqual(5000);
  });
});