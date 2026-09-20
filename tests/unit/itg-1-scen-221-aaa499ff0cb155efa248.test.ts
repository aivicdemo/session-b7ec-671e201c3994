import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-221: ハンディターミナルからのリアルタイム作業実績データを自動取得・集約', () => {
  describe('指定期間内にハンディターミナル連携ログが存在しない場合', () => {
    it('HandyTerminalSyncLogNotFound エラーが発生すること', async () => {
      // Arrange
      const facilityId = 'FAC-001';
      const teamId = null;
      const aggregationStartDateTime = '2024-01-01T00:00:00Z';
      const aggregationEndDateTime = '2024-01-01T23:59:59Z';
      const operatingUserId = 'USER-001';
      const includeWmsData = true;

      // スタブ: 権限検証をパスさせる
      jest.spyOn(workInstructionDeliveryManager, 'authorizeOperation' as any).mockResolvedValue(true);

      // スタブ: ハンディターミナル連携ログを空配列で返す
      jest.spyOn(workInstructionDeliveryManager, 'listHandyTerminalSyncLogByCondition' as any).mockResolvedValue([]);

      // Act & Assert
      try {
        await aggregateHandyTerminalWorkResults({
          facilityId,
          teamId,
          aggregationStartDateTime,
          aggregationEndDateTime,
          operatingUserId,
          includeWmsData,
        });
        fail('Expected HandyTerminalSyncLogNotFound error to be thrown');
      } catch (error: any) {
        expect(error.name).toBe('HandyTerminalSyncLogNotFound');
        expect(error.message).toBe('No handy terminal sync logs found for the specified period.');
      }
    });
  });
});