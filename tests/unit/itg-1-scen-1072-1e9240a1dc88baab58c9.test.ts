import { getHandyTerminalSyncLogById } from '../../src/logic/data-persistence';
import { GetHandyTerminalSyncLogByIdInput, GetHandyTerminalSyncLogByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-1072: 指定されたハンディターミナル連携ログID が存在する場合の検索', () => {
  it('should return handy terminal sync log data when valid log ID is provided', async () => {
    // Setup: 有効なハンディターミナル連携ログID
    const handyTerminalSyncLogId = 'HT-LOG-20250115-001';

    // Setup: テストデータをデータベースに挿入
    // (実際のテスト環境では、テストDBにセットアップデータを挿入するなどの準備を行う)
    const testLogData = {
      handyTerminalSyncLogId: 'HT-LOG-20250115-001',
      workerId: 'W-12345',
      handyTerminalId: 'HT-001',
      facilityId: 'F-001',
      syncType: 'work_result',
      workInstructionId: 'WI-001',
      syncContent: JSON.stringify({
        workDate: '2025-01-15',
        completedQuantity: 100,
        defectCount: 2,
      }),
      syncStatus: 'success',
      errorMessage: null,
      sentDateTime: '2025-01-15T09:00:00Z',
      receivedDateTime: '2025-01-15T09:00:05Z',
      processingCompletedDateTime: '2025-01-15T09:00:10Z',
      retryCount: 0,
      createdAt: '2025-01-15T09:00:10Z',
      updatedAt: '2025-01-15T09:00:10Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
    };

    // Execute: getHandyTerminalSyncLogById を呼び出す
    const input: GetHandyTerminalSyncLogByIdInput = {
      handyTerminalSyncLogId: handyTerminalSyncLogId,
    };

    const result = await getHandyTerminalSyncLogById(input);

    // Verify: 戻り値の型確認
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // Verify: 戻り値が GetHandyTerminalSyncLogByIdOutput 型であることを確認
    const output = result as GetHandyTerminalSyncLogByIdOutput;
    expect(output.handyTerminalSyncLogId).toBe('HT-LOG-20250115-001');
    expect(output.workerId).toBe('W-12345');
    expect(output.handyTerminalId).toBe('HT-001');
    expect(output.facilityId).toBe('F-001');

    // Verify: ハンディターミナル連携の履歴・ステータス・エラー内容が含まれている
    expect(output.syncType).toBe('work_result');
    expect(output.syncStatus).toBe('success');
    expect(output.syncContent).toBeDefined();
    expect(output.sentDateTime).toBe('2025-01-15T09:00:00Z');
    expect(output.receivedDateTime).toBe('2025-01-15T09:00:05Z');
    expect(output.processingCompletedDateTime).toBe('2025-01-15T09:00:10Z');

    // Verify: エラーメッセージが null であることを確認
    expect(output.errorMessage).toBeNull();

    // Verify: リトライ回数、作成・更新情報が含まれている
    expect(output.retryCount).toBe(0);
    expect(output.createdAt).toBe('2025-01-15T09:00:10Z');
    expect(output.updatedAt).toBe('2025-01-15T09:00:10Z');
    expect(output.createdBy).toBe('SYSTEM');
  });
});