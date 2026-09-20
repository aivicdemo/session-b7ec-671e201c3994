import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';

describe('SCEN-1036: 受領履歴IDがnullで指定されたときは新規作成として処理される', () => {
  it('should create a new reception history record when receptionHistoryId is null', async () => {
    const input = {
      receptionHistoryId: null,
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      receptionDateTime: '2024-01-15T10:30:00.000Z',
      receptionStatus: 'confirmed' as const,
      confirmationDateTime: '2024-01-15T10:35:00.000Z',
      deliveryMethod: 'handy_terminal' as const,
      remarks: null,
      createdBy: 'USR-admin',
      updatedBy: null,
    };

    const result = await saveWorkInstructionReceptionHistory(input);

    expect(result.receptionHistoryId).toBeDefined();
    expect(result.receptionHistoryId).not.toBeNull();
    expect(typeof result.receptionHistoryId).toBe('string');
    expect(result.receptionHistoryId.length).toBeGreaterThan(0);

    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.receptionDateTime).toBe('2024-01-15T10:30:00.000Z');
    expect(result.receptionStatus).toBe('confirmed');
    
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-15T10:35:00.000Z').getTime());

    expect(result.isNewRecord).toBe(true);
  });
});