import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';

describe('SCEN-114: リアルタイム作業実績データ受信・キャッシュ保存・WES送信遅延再試行制御', () => {
  describe('再試行上限が0以下のとき', () => {
    it('"再試行上限は1以上である必要があります"で throw される', async () => {
      const input = {
        workerId: 'W001',
        workTypeId: 'WT001',
        completedQuantity: 10,
        requiredTimeMinutes: 30,
        workDate: '2025-01-15',
        departmentId: 'D001',
        teamId: 'T001',
        siteId: 'S001',
        maxRetryAttempts: 0
      };

      await expect(receiveAndRecordWorkPerformanceData(input)).rejects.toThrow(
        '再試行上限は1以上である必要があります'
      );
    });
  });
});