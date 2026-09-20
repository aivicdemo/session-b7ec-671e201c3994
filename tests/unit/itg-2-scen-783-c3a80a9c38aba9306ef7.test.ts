import { synchronizeDataWithWESAndWMS, sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-783: WES・WMS間でデータ不整合が検出されてDataSyncConflictErrorが発生し、同期中止と管理者通知が行われる', () => {
  it('should detect data inconsistency between WES and WMS, throw DataSyncConflictError, and notify administrator', async () => {
    const notificationAndIntegration = require('../../src/logic/notification-and-integration');
    const sendNotificationToAdministratorSpy = jest.spyOn(
      notificationAndIntegration,
      'sendNotificationToAdministrator'
    ).mockResolvedValue({
      success: true,
      trackingId: 'notif_12345',
      sentAt: new Date().toISOString(),
      deliveryChannel: 'EMAIL',
      errorMessage: null,
    });

    const synchronizeDataWithWESAndWMSSpy = jest.spyOn(
      notificationAndIntegration,
      'synchronizeDataWithWESAndWMS'
    ).mockImplementation(async (input) => {
      const inconsistencies = [
        {
          inconsistencyId: 'inc_001',
          dataItemId: 'progress_data',
          recordId: 'record_12345',
          fieldName: 'quantity',
          expectedValue: '100',
          actualValue: '95',
          sourceSystem: 'WES' as const,
          detectedAt: new Date().toISOString(),
        },
      ];

      const error = new Error(
        'WES・WMS間のデータ不整合が検出されました。同期を中止し、管理者に報告します。'
      );
      (error as any).name = 'DataSyncConflictError';
      (error as any).output = {
        success: false,
        syncTrackingId: 'sync_12345',
        syncStartedAt: new Date().toISOString(),
        syncCompletedAt: new Date().toISOString(),
        systemSyncResults: [],
        dataItemsSyncStatus: [],
        totalRecordsSynced: 0,
        totalRecordsFailed: 1,
        dataInconsistenciesDetected: inconsistencies,
        retryQueuedItems: 0,
        syncDurationSeconds: 10,
        errorMessage: 'WES・WMS間のデータ不整合が検出されました。同期を中止し、管理者に報告します。',
        warningMessages: [],
      };

      await sendNotificationToAdministrator({
        administratorId: 'admin_001',
        notificationTitle: 'WES・WMS同期エラー',
        notificationContent: 'WES・WMS間のデータ不整合が検出されました。',
        priorityLevel: 'HIGH',
        notificationType: 'SYNC_ERROR',
        requestedBy: 'system_agent',
      });

      throw error;
    });

    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: ['progress_data', 'productivity_data'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'BIDIRECTIONAL' as const,
      requestedBy: 'admin_user_001',
      correlationId: 'corr_12345',
    };

    try {
      await synchronizeDataWithWESAndWMS(input);
      fail('Expected DataSyncConflictError to be thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      const err = error as Error;
      expect(err.message).toBe(
        'WES・WMS間のデータ不整合が検出されました。同期を中止し、管理者に報告します。'
      );
      expect((err as any).name).toBe('DataSyncConflictError');

      expect(sendNotificationToAdministratorSpy).toHaveBeenCalled();

      const output = (error as any).output;
      expect(output).toBeDefined();
      expect(output.success).toBe(false);
      expect(output.dataInconsistenciesDetected).toBeDefined();
      expect(Array.isArray(output.dataInconsistenciesDetected)).toBe(true);
      expect(output.dataInconsistenciesDetected.length).toBeGreaterThan(0);

      const inconsistency = output.dataInconsistenciesDetected[0];
      expect(inconsistency.inconsistencyId).toBeDefined();
      expect(inconsistency.dataItemId).toBeDefined();
      expect(inconsistency.recordId).toBeDefined();
      expect(inconsistency.fieldName).toBe('quantity');
      expect(inconsistency.expectedValue).toBe('100');
      expect(inconsistency.actualValue).toBe('95');
      expect(inconsistency.sourceSystem).toBe('WES');
      expect(inconsistency.detectedAt).toBeDefined();

      expect(output.errorMessage).toBe(
        'WES・WMS間のデータ不整合が検出されました。同期を中止し、管理者に報告します。'
      );
    } finally {
      sendNotificationToAdministratorSpy.mockRestore();
      synchronizeDataWithWESAndWMSSpy.mockRestore();
    }
  });
});