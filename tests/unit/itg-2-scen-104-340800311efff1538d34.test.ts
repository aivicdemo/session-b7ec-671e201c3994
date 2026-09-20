import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-104: 作業者生産性データ分析・配置最適化支援システム', () => {
  describe('作業者IDが存在しない場合、InvalidWorkerIdErrorを発生させる', () => {
    it('should throw InvalidWorkerIdError when worker ID does not exist', async () => {
      const input = {
        workerId: 'NONEXISTENT_001',
        workTypeId: 'WT001',
        completedQuantity: 10,
        requiredTimeMinutes: 30,
        workDate: '2025-01-15',
      };

      // スタブ処理: validateInputData を成功状態に設定
      const validateInputDataSpy = jest
        .spyOn(productivityModule as any, 'validateInputData')
        .mockResolvedValue(true);

      // スタブ処理: findWorkerById を設定し、与えられた workerId に対して null を返す
      const findWorkerByIdSpy = jest
        .spyOn(productivityModule as any, 'findWorkerById')
        .mockResolvedValue(null);

      // スタブ処理: 後続処理が実行されないことを確認するためのスパイ
      const findWorkTypeByIdSpy = jest
        .spyOn(productivityModule as any, 'findWorkTypeById')
        .mockResolvedValue({ workTypeId: 'WT001' });

      const savePerformanceRecordSpy = jest
        .spyOn(productivityModule as any, 'savePerformanceRecord')
        .mockResolvedValue({ performanceRecordId: 'PR001' });

      let errorThrown: any;
      try {
        await receiveAndRecordWorkPerformanceData(input);
        fail('Expected InvalidWorkerIdError to be thrown');
      } catch (error) {
        errorThrown = error;
      }

      expect(errorThrown).toBeDefined();
      expect(errorThrown.name).toBe('InvalidWorkerIdError');
      expect(errorThrown.message).toBe('作業者ID NONEXISTENT_001 は無効です。');

      // findWorkerById が呼び出されたことを検証
      expect(findWorkerByIdSpy).toHaveBeenCalledWith('NONEXISTENT_001');

      // 後続処理が実行されないことを検証
      expect(findWorkTypeByIdSpy).not.toHaveBeenCalled();
      expect(savePerformanceRecordSpy).not.toHaveBeenCalled();

      // クリーンアップ
      validateInputDataSpy.mockRestore();
      findWorkerByIdSpy.mockRestore();
      findWorkTypeByIdSpy.mockRestore();
      savePerformanceRecordSpy.mockRestore();
    });
  });
});