import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';
import type { SaveHandyTerminalSyncLogInput, SaveHandyTerminalSyncLogOutput } from '../../src/logic/data-persistence';

describe('SCEN-1064: ハンディターミナル連携ログの更新処理', () => {
  let createdLogId: string;

  beforeEach(async () => {
    // テスト対象データベースを初期化
    // 既存のハンディターミナル連携ログレコード1件を事前に作成
    const initialInput: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W001',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'initial' }),
      syncStatus: 'pending',
      errorMessage: undefined,
      sentDateTime: '2024-01-15T10:00:00Z',
      receivedDateTime: undefined,
      processingCompletedDateTime: undefined,
      retryCount: undefined,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    const initialOutput = await saveHandyTerminalSyncLog(initialInput);
    createdLogId = initialOutput.handyTerminalSyncLogId;
  });

  it('既存ログレコード更新時に有効なIDを指定すれば、該当ログを上書き更新し、作成フラグfalse・保存日時を返す', async () => {
    // 既存ログレコードを更新
    const updateInput: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: createdLogId,
      workerId: 'W001',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'position_update',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ latitude: 35.6762, longitude: 139.6503 }),
      syncStatus: 'success',
      errorMessage: undefined,
      sentDateTime: '2024-01-15T10:05:00Z',
      receivedDateTime: '2024-01-15T10:05:15Z',
      processingCompletedDateTime: '2024-01-15T10:05:30Z',
      retryCount: undefined,
      createdBy: 'USER001',
      updatedBy: 'USER002',
    };

    const output: SaveHandyTerminalSyncLogOutput = await saveHandyTerminalSyncLog(updateInput);

    // 出力型の検証
    expect(output.handyTerminalSyncLogId).toBe(createdLogId);
    expect(output.workerId).toBe('W001');
    expect(output.handyTerminalId).toBe('HT001');
    expect(output.facilityId).toBe('F001');
    expect(output.syncType).toBe('position_update');
    expect(output.syncStatus).toBe('success');
    expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(output.isNewRecord).toBe(false);
  });

  it('更新されたレコードがデータベースに永続化されていることを確認する', async () => {
    // 既存ログレコードを更新
    const updateInput: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: createdLogId,
      workerId: 'W001',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'position_update',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ latitude: 35.6762, longitude: 139.6503 }),
      syncStatus: 'success',
      errorMessage: undefined,
      sentDateTime: '2024-01-15T10:05:00Z',
      receivedDateTime: '2024-01-15T10:05:15Z',
      processingCompletedDateTime: '2024-01-15T10:05:30Z',
      retryCount: undefined,
      createdBy: 'USER001',
      updatedBy: 'USER002',
    };

    await saveHandyTerminalSyncLog(updateInput);

    // 永続化されたレコードを確認
    const persistedRecord = await getHandyTerminalSyncLogById(createdLogId);
    expect(persistedRecord.handyTerminalSyncLogId).toBe(createdLogId);
    expect(persistedRecord.syncType).toBe('position_update');
    expect(persistedRecord.syncStatus).toBe('success');
    expect(persistedRecord.syncContent).toBe(JSON.stringify({ latitude: 35.6762, longitude: 139.6503 }));
    expect(persistedRecord.processingCompletedDateTime).toBe('2024-01-15T10:05:30Z');
    expect(persistedRecord.updatedBy).toBe('USER002');
  });
});

// ヘルパー関数: 永続化されたレコードを確認用に取得
async function getHandyTerminalSyncLogById(logId: string) {
  // 実装は外部データソースからの取得を想定
  // テスト環境では、実装が必要な関数として提供されることを期待
  const { listHandyTerminalSyncLogByCondition } = await import('../../src/logic/data-persistence');
  
  const result = await listHandyTerminalSyncLogByCondition({
    handyTerminalSyncLogIds: [logId],
    pageNumber: 1,
    pageSize: 1,
  });

  if (result.handyTerminalSyncLogs.length === 0) {
    throw new Error(`ハンディターミナル連携ログが見つかりません: ${logId}`);
  }

  return result.handyTerminalSyncLogs[0];
}