import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';
import { SaveWorkInstructionReceptionHistoryInput, SaveWorkInstructionReceptionHistoryOutput } from '../../src/logic/data-persistence';

describe('SCEN-1023: 作業指示受領履歴の新規作成で isNewRecord が true を返す', () => {
  it('新規作成フラグが新規作成時にtrueを返す', async () => {
    // 入力データの構築
    const input: SaveWorkInstructionReceptionHistoryInput = {
      receptionHistoryId: null,
      workInstructionId: 'WI-001',
      workerId: 'WK-001',
      receptionDateTime: '2024-01-15T10:30:00.000Z',
      receptionStatus: 'confirmed',
      deliveryMethod: 'handy_terminal',
      remarks: undefined,
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    // saveWorkInstructionReceptionHistory を呼び出す
    const output: SaveWorkInstructionReceptionHistoryOutput = await saveWorkInstructionReceptionHistory(input);

    // 検証: isNewRecord が true であること
    expect(output.isNewRecord).toBe(true);

    // 検証: receptionHistoryId がシステムにより生成されたことを確認（null ではない）
    expect(output.receptionHistoryId).toBeTruthy();
    expect(typeof output.receptionHistoryId).toBe('string');

    // 検証: 入力値が正しく保持されていることを確認
    expect(output.workInstructionId).toBe('WI-001');
    expect(output.workerId).toBe('WK-001');
    expect(output.receptionDateTime).toBe('2024-01-15T10:30:00.000Z');
    expect(output.receptionStatus).toBe('confirmed');

    // 検証: savedAt が ISO 8601 形式であることを確認
    expect(output.savedAt).toBeTruthy();
    const savedAtDate = new Date(output.savedAt);
    expect(isNaN(savedAtDate.getTime())).toBe(false); // 有効な日付形式
  });
});