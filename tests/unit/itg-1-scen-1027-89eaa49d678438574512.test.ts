import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';

describe('SCEN-1027: 受領日時が無効な形式であるときInvalidReceptionDateTimeErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidReceptionDateTimeError when receptionDateTime has invalid format', async () => {
    // Arrange
    const invalidReceptionDateTime = '2024-13-45T99:99:99.999Z';
    
    const input = {
      receptionHistoryId: null,
      workInstructionId: 'work-instr-001',
      workerId: 'worker-001',
      receptionDateTime: invalidReceptionDateTime,
      receptionStatus: 'confirmed' as const,
      confirmationDateTime: undefined,
      deliveryMethod: 'handy_terminal' as const,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    // Act & Assert
    await expect(saveWorkInstructionReceptionHistory(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidReceptionDateTimeError',
        message: `受領日時 '${invalidReceptionDateTime}' は無効な形式またはシステム時刻より未来です。`,
      })
    );
  });

  it('should throw InvalidReceptionDateTimeError when receptionDateTime is future date', async () => {
    // Arrange
    const futureDateTime = new Date();
    futureDateTime.setDate(futureDateTime.getDate() + 1);
    const futureReceptionDateTime = futureDateTime.toISOString();

    const input = {
      receptionHistoryId: null,
      workInstructionId: 'work-instr-002',
      workerId: 'worker-002',
      receptionDateTime: futureReceptionDateTime,
      receptionStatus: 'pending' as const,
      confirmationDateTime: undefined,
      deliveryMethod: 'email' as const,
      remarks: undefined,
      createdBy: 'user-002',
      updatedBy: undefined,
    };

    // Act & Assert
    await expect(saveWorkInstructionReceptionHistory(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidReceptionDateTimeError',
        message: `受領日時 '${futureReceptionDateTime}' は無効な形式またはシステム時刻より未来です。`,
      })
    );
  });

  it('should throw InvalidReceptionDateTimeError with plain text date string', async () => {
    // Arrange
    const invalidDateTime = 'invalid-date';

    const input = {
      receptionHistoryId: null,
      workInstructionId: 'work-instr-003',
      workerId: 'worker-003',
      receptionDateTime: invalidDateTime,
      receptionStatus: 'confirmed' as const,
      confirmationDateTime: undefined,
      deliveryMethod: 'system_notification' as const,
      remarks: undefined,
      createdBy: 'user-003',
      updatedBy: undefined,
    };

    // Act & Assert
    await expect(saveWorkInstructionReceptionHistory(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidReceptionDateTimeError',
        message: `受領日時 '${invalidDateTime}' は無効な形式またはシステム時刻より未来です。`,
      })
    );
  });
});