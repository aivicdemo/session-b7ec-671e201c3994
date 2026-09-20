import { saveWorkInstructionReceptionHistory, InvalidReceptionStatusError } from '../../src/logic/data-persistence';
import { SaveWorkInstructionReceptionHistoryInput } from '../../src/logic/data-persistence';

describe('SCEN-1030: 受領確認状態が定義済みの値以外であるときInvalidReceptionStatusErrorが発生する', () => {
  it('receptionStatusが定義済み値の範囲外のときにInvalidReceptionStatusErrorが発生する', async () => {
    // Arrange
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'wi-12345',
      workerId: 'worker-001',
      receptionDateTime: '2024-01-15T10:30:00Z',
      receptionStatus: 'invalid_status', // 定義済み値以外
      confirmationDateTime: undefined,
      deliveryMethod: 'email',
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    // Act & Assert
    try {
      await saveWorkInstructionReceptionHistory(input);
      fail('InvalidReceptionStatusErrorが発生するはずです');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidReceptionStatusError);
      expect(error.message).toBe("受領確認状態 'invalid_status' は無効です。");
    }
  });
});