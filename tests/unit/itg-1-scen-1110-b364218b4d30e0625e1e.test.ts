import { getWmsSyncLogById } from '../../src/logic/data-persistence';

describe('SCEN-1110: WMS連携ログ検索機能', () => {
  describe('getWmsSyncLogById', () => {
    it('有効なWMS連携ログIDを指定して検索すると、対応するWMS連携ログデータが返される', async () => {
      // Arrange
      const validWmsSyncLogId = 'sync-log-20250115-001';

      // Act
      const result = await getWmsSyncLogById({
        wmsSyncLogId: validWmsSyncLogId,
      });

      // Assert
      expect(result).not.toBeNull();
      expect(result).toBeDefined();
      expect(result.wmsSyncLogId).toBe(validWmsSyncLogId);
      expect(result.syncType).toBeDefined();
      expect(result.syncDirection).toBeDefined();
      expect(result.facilityId).toBeDefined();
      expect(result.syncStatus).toBeDefined();
      expect(result.syncStartDateTime).toBeDefined();
      expect(result.processedItemCount).toBeGreaterThanOrEqual(0);
      expect(result.successItemCount).toBeGreaterThanOrEqual(0);
      expect(result.failureItemCount).toBeGreaterThanOrEqual(0);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdBy).toBeDefined();
    });
  });
});