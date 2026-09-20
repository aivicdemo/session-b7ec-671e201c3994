import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';

describe('SCEN-307: 指示受領時刻・実行開始時刻の記録', () => {
  describe('エッジケース: 指示IDが空または存在しないとき', () => {
    it('InstructionNotFoundErrorが発生し、エラー文言が正しいことを確認する', async () => {
      const workerId = 'W001';
      const instructionId = '';
      const instructionReceiptDateTime = new Date('2024-01-15T09:00:00Z');
      const executionStartDateTime = new Date('2024-01-15T09:00:05Z');

      await expect(
        recordWorkInstructionReceipt({
          workerId,
          instructionId,
          instructionReceiptDateTime,
          executionStartDateTime,
        })
      ).rejects.toThrow('指示ID  が見つかりません。');
    });
  });
});