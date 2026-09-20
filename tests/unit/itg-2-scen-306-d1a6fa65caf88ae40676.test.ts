import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';
import { RecordWorkInstructionReceiptInput } from '../../src/logic/work-execution-tracking';

describe('SCEN-306: 作業者IDが空または不正な形式のとき、バリデーションエラーが発生する', () => {
  it('should reject when workerId is empty string', async () => {
    const input: RecordWorkInstructionReceiptInput = {
      workerId: '',
      instructionId: 'valid-instruction-id-123',
      instructionReceiptDateTime: new Date(),
      executionStartDateTime: new Date(),
    };

    await expect(recordWorkInstructionReceipt(input)).rejects.toThrow();
  });

  it('should reject when workerId is invalid format', async () => {
    const input: RecordWorkInstructionReceiptInput = {
      workerId: '!!!invalid!!!',
      instructionId: 'valid-instruction-id-456',
      instructionReceiptDateTime: new Date(),
      executionStartDateTime: new Date(),
    };

    await expect(recordWorkInstructionReceipt(input)).rejects.toThrow();
  });

  it('should reject when workerId contains only whitespace', async () => {
    const input: RecordWorkInstructionReceiptInput = {
      workerId: '   ',
      instructionId: 'valid-instruction-id-789',
      instructionReceiptDateTime: new Date(),
      executionStartDateTime: new Date(),
    };

    await expect(recordWorkInstructionReceipt(input)).rejects.toThrow();
  });
});