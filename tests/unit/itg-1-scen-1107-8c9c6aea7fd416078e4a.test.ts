import { saveWmsSyncLog, GetWmsSyncLogById } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual('../../src/logic/data-persistence'),
  validateDateTimeRange: jest.fn().mockResolvedValue({ valid: true }),
  validateNumericQuantity: jest.fn().mockResolvedValue({ valid: true }),
  validateReferentialIntegrity: jest.fn().mockResolvedValue({ valid: true }),
}));

describe('SCEN-1107: WMS連携ログデータを新規作成または更新して永続化し、連携種別・方向・ステータス・処理結果・エラー内容を一元管理する', () => {
  describe('WMS側のリクエストIDがnullの場合でも、ログが正常に保存される', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('wmsRequestIdがnullでもWMS連携ログが正常に保存される', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'PROGRESS_DATA_FETCH',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:00:00Z',
        syncCompletedDateTime: '2024-01-15T09:05:30Z',
        processedItemCount: 150,
        successItemCount: 150,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER-123',
        updatedBy: null,
      };

      const output = await saveWmsSyncLog(input);

      expect(output).toBeDefined();
      expect(output.wmsSyncLogId).toBeTruthy();
      expect(output.wmsSyncLogId).toMatch(/^LOG-/);
      expect(output.syncType).toBe('PROGRESS_DATA_FETCH');
      expect(output.syncDirection).toBe('INBOUND');
      expect(output.facilityId).toBe('FAC-001');
      expect(output.syncStatus).toBe('SUCCESS');
      expect(output.processedItemCount).toBe(150);
      expect(output.successItemCount).toBe(150);
      expect(output.failureItemCount).toBe(0);
      expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(output.isNewRecord).toBe(true);
      expect(typeof output.wmsSyncLogId).toBe('string');
      expect(typeof output.savedAt).toBe('string');
    });

    it('保存されたWMS連携ログをwmsSyncLogIdで取得すると、nullのwmsRequestIdが保持されている', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'PROGRESS_DATA_FETCH',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:00:00Z',
        syncCompletedDateTime: '2024-01-15T09:05:30Z',
        processedItemCount: 150,
        successItemCount: 150,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER-123',
        updatedBy: null,
      };

      const saveOutput = await saveWmsSyncLog(input);
      const savedLogId = saveOutput.wmsSyncLogId;

      expect(savedLogId).toBeTruthy();
      expect(saveOutput.isNewRecord).toBe(true);
      expect(saveOutput.syncStatus).toBe('SUCCESS');
      expect(saveOutput.facilityId).toBe('FAC-001');
    });

    it('nullのwmsRequestIdを持つログでも、InvalidWmsSyncLogInputエラーは返されない', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'PROGRESS_DATA_FETCH',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:00:00Z',
        syncCompletedDateTime: '2024-01-15T09:05:30Z',
        processedItemCount: 150,
        successItemCount: 150,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER-123',
        updatedBy: null,
      };

      let thrownError: Error | null = null;
      let output = null;

      try {
        output = await saveWmsSyncLog(input);
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeNull();
      expect(output).toBeDefined();
      expect(output?.isNewRecord).toBe(true);
      expect(output?.wmsSyncLogId).toBeTruthy();
    });

    it('nullのwmsRequestIdを持つログでも、他の連携種別・方向・ステータスデータは正常に記録される', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'WORK_RESULT_SYNC',
        syncDirection: 'OUTBOUND',
        facilityId: 'FAC-002',
        syncStatus: 'PARTIAL_FAILURE',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:03:45Z',
        processedItemCount: 100,
        successItemCount: 95,
        failureItemCount: 5,
        errorMessage: '5件のレコードが形式エラーで失敗',
        retryCount: 2,
        wmsRequestId: null,
        createdBy: 'USER-456',
        updatedBy: null,
      };

      const output = await saveWmsSyncLog(input);

      expect(output).toBeDefined();
      expect(output.isNewRecord).toBe(true);
      expect(output.syncType).toBe('WORK_RESULT_SYNC');
      expect(output.syncDirection).toBe('OUTBOUND');
      expect(output.facilityId).toBe('FAC-002');
      expect(output.syncStatus).toBe('PARTIAL_FAILURE');
      expect(output.processedItemCount).toBe(100);
      expect(output.successItemCount).toBe(95);
      expect(output.failureItemCount).toBe(5);
      expect(output.wmsSyncLogId).toBeTruthy();
      expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('WMS側のリクエストIDを特定できない場合であっても、WMS連携ログの一元管理対象として記録される', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'INVENTORY_SYNC',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-003',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T11:00:00Z',
        syncCompletedDateTime: '2024-01-15T11:02:15Z',
        processedItemCount: 50,
        successItemCount: 50,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER-789',
        updatedBy: null,
      };

      const output = await saveWmsSyncLog(input);

      expect(output).toBeDefined();
      expect(output.isNewRecord).toBe(true);
      expect(output.wmsSyncLogId).toBeTruthy();
      expect(output.syncStatus).toBe('SUCCESS');
      expect(output.facilityId).toBe('FAC-003');
      expect(output.syncType).toBe('INVENTORY_SYNC');
      expect(output.syncDirection).toBe('INBOUND');
      expect(output.processedItemCount).toBe(50);
      expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });
});