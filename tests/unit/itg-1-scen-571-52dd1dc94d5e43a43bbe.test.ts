import { saveWorker } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン', () => {
  describe('SCEN-571: 既存作業者を正しい情報で更新すると、入力IDと保存日時を含む更新レコードが返される', () => {
    it('既存作業者の情報を更新し、更新フラグがfalseで返される', async () => {
      // Arrange: 前提条件を準備
      const workerId = 'W001';
      const workerName = '田中太郎';
      const facilityId = 'F001';
      const teamId = 'T001';
      const jobType = 'ピッキング作業';
      const operatingStatus = '稼働中';
      const hourlyRate = 1200;
      const maxWorkingHours = 8;
      const createdBy = 'admin_user';
      const updatedBy = 'update_user';

      const input = {
        workerId,
        workerName,
        facilityId,
        teamId,
        jobType,
        operatingStatus,
        hourlyRate,
        maxWorkingHours,
        createdBy,
        updatedBy,
      };

      // Act: saveWorkerを呼び出す
      const result = await saveWorker(input);

      // Assert: SaveWorkerOutputの検証
      expect(result.workerId).toBe('W001');
      expect(result.workerName).toBe('田中太郎');
      expect(result.facilityId).toBe('F001');
      expect(result.teamId).toBe('T001');
      expect(result.isNewRecord).toBe(false);
      
      // savedAtがISO 8601形式であることを検証
      expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
      
      // savedAtが有効な日付であることを検証
      const savedDate = new Date(result.savedAt);
      expect(savedDate.getTime()).toBeGreaterThan(0);
    });
  });
});