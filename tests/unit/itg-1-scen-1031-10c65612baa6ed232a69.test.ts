import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';
import { SaveWorkInstructionReceptionHistoryInput } from '../../src/logic/data-persistence';

describe('SCEN-1031: 配信方法が定義済みの値以外であるときInvalidDeliveryMethodErrorが発生する', () => {
  it('should throw InvalidDeliveryMethodError when deliveryMethod is not a valid predefined value', async () => {
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'valid_id_001',
      workerId: 'valid_worker_001',
      receptionDateTime: '2025-01-15T10:30:00.000Z',
      receptionStatus: 'confirmed',
      confirmationDateTime: '2025-01-15T10:35:00.000Z',
      deliveryMethod: 'invalid_method',
      remarks: null,
      createdBy: 'user_001',
      updatedBy: null,
    };

    await expect(saveWorkInstructionReceptionHistory(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDeliveryMethodError',
        message: expect.stringContaining("配信方法 'invalid_method' は無効です。"),
      })
    );
  });
});