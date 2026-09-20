import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-105: ハンディターミナルからのリアルタイム作業実績データ受信', () => {
  describe('作業種別がマスタに存在しない場合', () => {
    it('InvalidWorkTypeErrorを発生させる', async () => {
      const validateInputDataSpy = jest.spyOn(productivityModule as any, 'validateInputData').mockResolvedValue(true);
      const findWorkerByIdSpy = jest.spyOn(productivityModule as any, 'findWorkerById').mockResolvedValue({
        workerId: 'W001',
        workerName: 'Test Worker',
      });
      const findWorkTypeByIdSpy = jest.spyOn(productivityModule as any, 'findWorkTypeById').mockResolvedValue(null);
      const savePerformanceRecordSpy = jest.spyOn(productivityModule as any, 'savePerformanceRecord').mockResolvedValue({});
      const cachePerformanceDataSpy = jest.spyOn(productivityModule as any, 'cachePerformanceData').mockResolvedValue({});
      const sendToWesSpy = jest.spyOn(productivityModule as any, 'sendToWes').mockResolvedValue({});

      const input = {
        workerId: 'W001',
        workTypeId: 'INVALID_TYPE_999',
        completedQuantity: 50,
        requiredTimeMinutes: 120,
        workDate: '2024-01-15',
        departmentId: 'D01',
        teamId: 'T01',
        siteId: 'S01',
      };

      await expect(receiveAndRecordWorkPerformanceData(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWorkTypeError',
          message: '作業種別 INVALID_TYPE_999 は無効です。',
        })
      );

      expect(validateInputDataSpy).toHaveBeenCalledWith(input);
      expect(findWorkerByIdSpy).toHaveBeenCalledWith('W001');
      expect(findWorkTypeByIdSpy).toHaveBeenCalledWith('INVALID_TYPE_999');
      expect(savePerformanceRecordSpy).not.toHaveBeenCalled();
      expect(cachePerformanceDataSpy).not.toHaveBeenCalled();
      expect(sendToWesSpy).not.toHaveBeenCalled();

      validateInputDataSpy.mockRestore();
      findWorkerByIdSpy.mockRestore();
      findWorkTypeByIdSpy.mockRestore();
      savePerformanceRecordSpy.mockRestore();
      cachePerformanceDataSpy.mockRestore();
      sendToWesSpy.mockRestore();
    });
  });
});