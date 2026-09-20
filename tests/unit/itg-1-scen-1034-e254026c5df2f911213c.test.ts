import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';
import { SaveWorkInstructionReceptionHistoryInput } from '../../src/logic/data-persistence';

describe('SCEN-1034: 確認日時が指定されていないときは任意項目として受け入れられる', () => {
  it('should accept null confirmationDateTime and create new reception history record', async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'WI-001',
      workerId: 'W-001',
      receptionDateTime: '2024-01-15T10:30:00.000Z',
      receptionStatus: 'pending',
      confirmationDateTime: null,
      deliveryMethod: 'handy_terminal',
      remarks: null,
      createdBy: 'admin-001',
      updatedBy: null,
    };

    // Act
    const result = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBeTruthy();
    expect(typeof result.receptionHistoryId).toBe('string');
    expect(result.receptionHistoryId).not.toEqual(null);
    
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('W-001');
    expect(result.receptionDateTime).toBe('2024-01-15T10:30:00.000Z');
    expect(result.receptionStatus).toBe('pending');
    
    expect(result.savedAt).toBeTruthy();
    expect(typeof result.savedAt).toBe('string');
    // Verify savedAt is in ISO 8601 format
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);
    
    expect(result.isNewRecord).toBe(true);
  });

  it('should accept undefined confirmationDateTime and create new reception history record', async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'WI-002',
      workerId: 'W-002',
      receptionDateTime: '2024-01-15T11:00:00.000Z',
      receptionStatus: 'pending',
      confirmationDateTime: undefined,
      deliveryMethod: 'email',
      remarks: undefined,
      createdBy: 'admin-002',
      updatedBy: undefined,
    };

    // Act
    const result = await saveWorkInstructionReceptionHistory(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBeTruthy();
    expect(result.isNewRecord).toBe(true);
    expect(result.workInstructionId).toBe('WI-002');
    expect(result.workerId).toBe('W-002');
    expect(result.receptionStatus).toBe('pending');
  });

  it('should not throw error when confirmationDateTime is not provided', async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'WI-003',
      workerId: 'W-003',
      receptionDateTime: '2024-01-15T12:00:00.000Z',
      receptionStatus: 'pending',
      deliveryMethod: 'system_notification',
      remarks: null,
      createdBy: 'admin-003',
    };

    // Act & Assert
    await expect(saveWorkInstructionReceptionHistory(input)).resolves.toBeDefined();
  });
});