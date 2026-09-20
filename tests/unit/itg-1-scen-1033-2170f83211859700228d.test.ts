import {
  saveWorkInstructionReceptionHistory,
  SaveWorkInstructionReceptionHistoryInput,
} from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1033: saveWorkInstructionReceptionHistory - Database Error Handling', () => {
  let validateReferentialIntegritySpy: jest.SpyInstance;

  beforeEach(() => {
    validateReferentialIntegritySpy = jest.spyOn(
      dataPersistence,
      'validateReferentialIntegrity' as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidWorkInstructionIdError when referential integrity validation fails', async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'WI-001',
      workerId: 'WR-001',
      receptionDateTime: '2025-01-15T10:30:00.000Z',
      receptionStatus: 'confirmed',
      confirmationDateTime: '2025-01-15T10:35:00.000Z',
      deliveryMethod: 'handy_terminal',
      createdBy: 'USR-001',
    };

    const invalidWorkInstructionError = new Error(
      "作業指示ID 'WI-001' は存在しません。"
    );
    invalidWorkInstructionError.name = 'InvalidWorkInstructionIdError';

    validateReferentialIntegritySpy.mockImplementation(() => {
      throw invalidWorkInstructionError;
    });

    let thrownError: any;
    try {
      await saveWorkInstructionReceptionHistory(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('InvalidWorkInstructionIdError');
    expect(thrownError.message).toBe("作業指示ID 'WI-001' は存在しません。");
    expect(validateReferentialIntegritySpy).toHaveBeenCalledWith(
      'WI-001',
      'WR-001'
    );
  });
});