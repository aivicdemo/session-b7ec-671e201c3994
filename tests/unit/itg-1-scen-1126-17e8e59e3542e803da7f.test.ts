import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';
import type { ListWmsSyncLogByConditionInput, ListWmsSyncLogByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1126: WMS連携ログのソート機能', () => {
  it('ソート指定時に、指定フィールドと順序に従ってレコードが並び替えられる', async () => {
    // 準備：テスト用データベースに3件のWMS連携ログレコードを挿入
    const testData = [
      {
        wmsSyncLogId: 'LOG001',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'FAC001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:05:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'REQ001',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'LOG003',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'FAC001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T08:00:00Z',
        syncCompletedDateTime: '2024-01-15T08:05:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'REQ003',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'LOG002',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'FAC001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:30:00Z',
        syncCompletedDateTime: '2024-01-15T09:35:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'REQ002',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
        createdBy: 'user001',
        updatedBy: null,
      },
    ];

    // 入力値を準備
    const input: ListWmsSyncLogByConditionInput = {
      sortBy: 'syncStartDateTime',
      sortOrder: 'ASC',
      wmsSyncLogIds: undefined,
      syncTypes: undefined,
      syncDirections: undefined,
      facilityIds: undefined,
      syncStatuses: undefined,
      workInstructionIds: undefined,
      syncStartFromDateTime: undefined,
      syncStartToDateTime: undefined,
      syncCompletedFromDateTime: undefined,
      syncCompletedToDateTime: undefined,
      minProcessedItemCount: undefined,
      maxProcessedItemCount: undefined,
      minRetryCount: undefined,
      maxRetryCount: undefined,
      wmsRequestIds: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // テスト対象の処理を呼び出す
    const result: ListWmsSyncLogByConditionOutput = await listWmsSyncLogByCondition(input);

    // 出力の検証
    expect(result).toBeDefined();
    expect(result.wmsSyncLogs).toBeDefined();
    expect(Array.isArray(result.wmsSyncLogs)).toBe(true);

    // totalCountの検証
    expect(result.totalCount).toBe(3);

    // wmsSyncLogs配列の要素順序を検証（同期開始日時の昇順）
    expect(result.wmsSyncLogs.length).toBe(3);

    // 最初の要素：LOG003（2024-01-15T08:00:00Z）
    expect(result.wmsSyncLogs[0].wmsSyncLogId).toBe('LOG003');
    expect(result.wmsSyncLogs[0].syncStartDateTime).toBe('2024-01-15T08:00:00Z');

    // 2番目の要素：LOG002（2024-01-15T09:30:00Z）
    expect(result.wmsSyncLogs[1].wmsSyncLogId).toBe('LOG002');
    expect(result.wmsSyncLogs[1].syncStartDateTime).toBe('2024-01-15T09:30:00Z');

    // 3番目の要素：LOG001（2024-01-15T10:00:00Z）
    expect(result.wmsSyncLogs[2].wmsSyncLogId).toBe('LOG001');
    expect(result.wmsSyncLogs[2].syncStartDateTime).toBe('2024-01-15T10:00:00Z');

    // retrievedAtがISO 8601形式の現在日時であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
  });
});