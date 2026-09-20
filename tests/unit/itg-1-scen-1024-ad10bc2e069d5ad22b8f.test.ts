import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';

describe('SCEN-1024: 新規作成フラグが更新時にfalseを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isNewRecord=false when updating existing reception history', async () => {
    // Step 1: 既存の受領履歴レコードをデータベースに事前に準備
    const existingReceptionHistoryId = 'RH-001';
    const workInstructionId = 'WI-100';
    const workerId = 'W-50';
    const originalReceptionDateTime = '2024-01-15T10:30:00.000Z';
    const originalReceptionStatus = 'pending';
    const originalDeliveryMethod = 'handy_terminal';
    const originalCreatedBy = 'USER-A';

    // Step 2: saveWorkInstructionReceptionHistory を呼び出す際の入力を指定
    const updateInput = {
      receptionHistoryId: existingReceptionHistoryId,
      workInstructionId: workInstructionId,
      workerId: workerId,
      receptionDateTime: '2024-01-15T10:45:00.000Z',
      receptionStatus: 'confirmed' as const,
      confirmationDateTime: '2024-01-15T10:46:00.000Z',
      deliveryMethod: 'handy_terminal' as const,
      remarks: '確認済み',
      createdBy: originalCreatedBy,
      updatedBy: 'USER-B',
    };

    // Step 3, 4: saveWorkInstructionReceptionHistory を実行
    // 実装側が内部で referential integrity と date time range を検証する
    // 仕様の前提: workInstructionId='WI-100', workerId='W-50' が有効
    // 仕様の前提: receptionDateTime が有効形式でシステム時刻より未来でない
    // 仕様の前提: confirmationDateTime が receptionDateTime より後
    const result = await saveWorkInstructionReceptionHistory(updateInput);

    // expectedResult: 出力型 SaveWorkInstructionReceptionHistoryOutput が返却される
    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBe(existingReceptionHistoryId);
    expect(result.workInstructionId).toBe(workInstructionId);
    expect(result.workerId).toBe(workerId);
    expect(result.receptionDateTime).toBe('2024-01-15T10:45:00.000Z');
    expect(result.receptionStatus).toBe('confirmed');

    // savedAt が現在のシステム時刻（ISO 8601形式）であることを検証
    expect(result.savedAt).toBeDefined();
    const savedAtTime = new Date(result.savedAt).getTime();
    const currentTime = Date.now();
    expect(Math.abs(savedAtTime - currentTime)).toBeLessThan(5000); // 5秒以内の許容範囲
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.savedAt)).toBe(true); // ISO 8601形式

    // isNewRecord=false（更新時であることを示す）
    expect(result.isNewRecord).toBe(false);
  });
});