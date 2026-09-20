import { saveWmsSyncLog, listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1096: WMS連携ログを更新する場合の仕様', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存のログIDを指定して入力データが有効だと、既存レコードが更新され出力に isNewRecord=false が返される', async () => {
    // Arrange: 既存のWMS連携ログレコードをデータベースに事前作成
    const existingRecord = {
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND' as const,
      facilityId: 'FC-001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      createdBy: 'USER-001',
    };

    // 既存レコードをDBに作成
    const createdRecord = await saveWmsSyncLog({
      wmsSyncLogId: null,
      ...existingRecord,
    });

    const createdLogId = createdRecord.wmsSyncLogId;

    // Act: 既存ログIDを指定して更新データを投入
    const updateInput = {
      wmsSyncLogId: createdLogId,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND' as const,
      facilityId: 'FC-001',
      syncStatus: 'PARTIAL_FAILURE',
      syncStartDateTime: '2024-01-15T10:00:00Z',
      syncCompletedDateTime: '2024-01-15T10:30:00Z',
      processedItemCount: 100,
      successItemCount: 95,
      failureItemCount: 5,
      errorMessage: '一部の進捗データが不整合です',
      retryCount: 1,
      wmsRequestId: 'WMS-REQ-12345',
      createdBy: 'USER-001',
      updatedBy: 'USER-002',
    };

    const result = await saveWmsSyncLog(updateInput);

    // Assert: 出力が期待値で返される
    expect(result.wmsSyncLogId).toBe(createdLogId);
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.facilityId).toBe('FC-001');
    expect(result.syncStatus).toBe('PARTIAL_FAILURE');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(95);
    expect(result.failureItemCount).toBe(5);
    expect(result.isNewRecord).toBe(false);

    // Assert: savedAtがISO 8601形式で返される
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-15T10:30:00Z').getTime()
    );

    // Assert: DB上のレコードが更新されていることを確認（取得して検証）
    const listResult = await listWmsSyncLogByCondition({
      wmsSyncLogIds: [createdLogId],
    });

    expect(listResult.wmsSyncLogs).toHaveLength(1);
    const updatedRecord = listResult.wmsSyncLogs[0];
    expect(updatedRecord.syncStatus).toBe('PARTIAL_FAILURE');
    expect(updatedRecord.syncCompletedDateTime).toBe('2024-01-15T10:30:00Z');
    expect(updatedRecord.failureItemCount).toBe(5);
    expect(updatedRecord.errorMessage).toBe('一部の進捗データが不整合です');
    expect(updatedRecord.updatedBy).toBe('USER-002');

    // Assert: updatedAtフィールドがsavedAt以降の日時であることを確認
    expect(updatedRecord.updatedAt).toBeDefined();
    expect(typeof updatedRecord.updatedAt).toBe('string');
    const updatedAtDate = new Date(updatedRecord.updatedAt);
    expect(updatedAtDate.getTime()).toBeGreaterThanOrEqual(
      savedAtDate.getTime()
    );
  });
});