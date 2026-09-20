import { listWmsSyncLogByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1132: WMS連携ログデータ一覧取得時のデータ取得日時形式検証', () => {
  it('検索条件に合致するWMS連携ログを取得し、retrievedAtがISO 8601形式で返されること', async () => {
    const input = {
      syncStatuses: ['success'],
      facilityIds: ['facility-001'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWmsSyncLogByCondition(input);

    // ISO 8601形式のパターン（例：2025-01-15T14:30:45.123Z または 2025-01-15T14:30:45+09:00）
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).not.toBeNull();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(iso8601Pattern);

    // フォーマットが正しく解析可能であることを確認
    const parsedDate = new Date(result.retrievedAt);
    expect(parsedDate.toString()).not.toBe('Invalid Date');
  });

  it('retrievedAtがUNIXタイムスタンプやその他の形式でないこと', async () => {
    const input = {
      syncStatuses: ['success'],
      facilityIds: ['facility-001'],
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWmsSyncLogByCondition(input);

    // UNIXタイムスタンプ（数値）でないことを確認
    expect(typeof result.retrievedAt).not.toBe('number');

    // 「2025/01/15 14:30:45」などの非ISO 8601形式でないことを確認
    expect(result.retrievedAt).not.toMatch(/^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}$/);

    // 空文字列でないこと
    expect(result.retrievedAt).not.toBe('');
  });

  it('複数のWMS連携ログが返される場合、retrievedAtが各レコードで一貫性をもって返されること', async () => {
    const input = {
      syncStatuses: ['success', 'failure'],
      facilityIds: ['facility-001', 'facility-002'],
      pageNumber: 1,
      pageSize: 20,
    };

    const result = await listWmsSyncLogByCondition(input);

    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

    // retrievedAtが返されていること
    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).toMatch(iso8601Pattern);

    // wmsSyncLogsが配列であることを確認
    expect(Array.isArray(result.wmsSyncLogs)).toBe(true);

    // totalCountが数値であることを確認
    expect(typeof result.totalCount).toBe('number');
  });

  it('ページネーション指定時でもretrievedAtがISO 8601形式で返されること', async () => {
    const input = {
      pageNumber: 2,
      pageSize: 5,
    };

    const result = await listWmsSyncLogByCondition(input);

    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).toMatch(iso8601Pattern);
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('フィルタ条件を指定しない場合でもretrievedAtがISO 8601形式で返されること', async () => {
    const input = {};

    const result = await listWmsSyncLogByCondition(input);

    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

    expect(result.retrievedAt).toBeDefined();
    expect(result.retrievedAt).toMatch(iso8601Pattern);
  });
});