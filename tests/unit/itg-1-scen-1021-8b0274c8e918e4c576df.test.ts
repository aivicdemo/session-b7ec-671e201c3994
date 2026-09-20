import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';

describe('SCEN-1021: 新規作成時に受領履歴が保存され、システムが生成したIDと保存完了日時を返す', () => {
  it('should create new reception history record and return generated ID with current timestamp', async () => {
    const currentDateTime = new Date().toISOString();
    const receptionDateTime = '2025-01-15T10:30:00.000Z';

    const input = {
      receptionHistoryId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-100',
      receptionDateTime: receptionDateTime,
      receptionStatus: 'pending' as const,
      confirmationDateTime: undefined,
      deliveryMethod: 'handy_terminal' as const,
      remarks: undefined,
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    const output = await saveWorkInstructionReceptionHistory(input);

    expect(output.receptionHistoryId).toBeDefined();
    expect(output.receptionHistoryId).not.toBe('');
    expect(typeof output.receptionHistoryId).toBe('string');

    expect(output.workInstructionId).toBe('WI-001');
    expect(output.workerId).toBe('WKR-100');
    expect(output.receptionDateTime).toBe(receptionDateTime);
    expect(output.receptionStatus).toBe('pending');

    expect(output.savedAt).toBeDefined();
    const savedAtDate = new Date(output.savedAt);
    const currentDate = new Date(currentDateTime);
    const timeDifference = Math.abs(savedAtDate.getTime() - currentDate.getTime());
    expect(timeDifference).toBeLessThan(5000);

    expect(output.isNewRecord).toBe(true);
  });
});