import { listWmsSyncLogByCondition, ListWmsSyncLogByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-1128: WMS連携ログの複数条件検索', () => {
  it('複数の検索条件を組み合わせて指定した場合、すべての条件に同時に合致するレコードのみが返される', async () => {
    const input: ListWmsSyncLogByConditionInput = {
      syncTypes: ['進捗データ取得'],
      syncDirections: ['WMS→システム'],
      syncStatuses: ['成功'],
      facilityIds: ['facility-001'],
      minProcessedItemCount: 10,
      maxProcessedItemCount: 100,
    };

    const result = await listWmsSyncLogByCondition(input);

    expect(result).toBeDefined();
    expect(result.wmsSyncLogs).toBeDefined();
    expect(Array.isArray(result.wmsSyncLogs)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();

    result.wmsSyncLogs.forEach((log) => {
      expect(input.syncTypes).toContain(log.syncType);
      expect(input.syncDirections).toContain(log.syncDirection);
      expect(input.syncStatuses).toContain(log.syncStatus);
      expect(input.facilityIds).toContain(log.facilityId);
      expect(log.processedItemCount).toBeGreaterThanOrEqual(10);
      expect(log.processedItemCount).toBeLessThanOrEqual(100);
    });

    const hasNonMatchingRecords = result.wmsSyncLogs.some(
      (log) =>
        !input.syncTypes?.includes(log.syncType) ||
        !input.syncDirections?.includes(log.syncDirection) ||
        !input.syncStatuses?.includes(log.syncStatus) ||
        !input.facilityIds?.includes(log.facilityId) ||
        log.processedItemCount < 10 ||
        log.processedItemCount > 100
    );
    expect(hasNonMatchingRecords).toBe(false);

    expect(result.totalCount).toBeGreaterThanOrEqual(result.wmsSyncLogs.length);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);
  });
});