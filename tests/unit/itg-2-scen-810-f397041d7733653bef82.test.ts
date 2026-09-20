import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';
import * as db from '../../src/db';

jest.mock('../../src/db');

describe('SCEN-810: notifyPerformanceDataSaved - Error handling for non-existent performance record', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PerformanceDataNotFound error when specified performanceRecordId does not exist', async () => {
    // スタブ設定: データベースから実績レコードを取得するスタブを設定し、指定された performanceRecordId に対応するレコードが存在しないことをシミュレートする
    (db.getPerformanceRecord as jest.Mock).mockResolvedValueOnce(null);

    const input = {
      performanceRecordId: 'non-existent-record-id',
      workerId: 'W001',
      workerName: '山田太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      departmentId: 'DEPT-001',
      workDate: '2024-01-15',
      completedQuantity: 150,
      workTypeId: 'WT-001',
      qualityScore: 85,
      savedAt: '2024-01-15T10:30:00Z',
      requestedBy: 'USER-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    let thrownError: any;
    try {
      await notifyPerformanceDataSaved(input);
    } catch (error) {
      thrownError = error;
    }

    // 関数がスローするエラーをキャッチする
    expect(thrownError).toBeDefined();
    expect(thrownError.name || thrownError.constructor.name).toBe('PerformanceDataNotFound');
    expect(thrownError.message).toContain('指定された実績データが見つかりません。');

    // 期待結果: 以降の処理は実行されない
    // 進捗監視エンジンへのトリガー発火が行われない
    expect(db.triggerProgressMonitoring).not.toHaveBeenCalled();
    // 配置最適化エンジンへのトリガー発火が行われない
    expect(db.triggerPlacementOptimization).not.toHaveBeenCalled();
    // 管理者への通知送信が行われない
    expect(db.sendAdministratorNotification).not.toHaveBeenCalled();
    // 外部システムとのデータ同期が行われない
    expect(db.syncWithExternalSystems).not.toHaveBeenCalled();
  });
});