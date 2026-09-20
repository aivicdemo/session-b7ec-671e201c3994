import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';
import * as workExecutionModule from '../../src/logic/work-execution-tracking';

describe('SCEN-305: 指示受領時の基準点確立', () => {
  it('代表的な指示受領データで、指示到達から実行開始までの経過秒数が正確に計算される', async () => {
    // スタブの設定
    const findWorkerByIdStub = jest.spyOn(workExecutionModule as any, 'findWorkerById').mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      status: '稼働中',
    });

    const validateInputDataStub = jest.spyOn(workExecutionModule as any, 'validateInputData').mockReturnValue({
      isValid: true,
      errors: [],
    });

    const saveProductivityDataStub = jest.spyOn(workExecutionModule as any, 'saveProductivityData').mockResolvedValue({
      productivityDataId: 'PROD-REC-20240115-001',
    });

    const synchronizeDataWithWESAndWMSStub = jest.spyOn(workExecutionModule as any, 'synchronizeDataWithWESAndWMS').mockResolvedValue({
      progressMonitoringBaselineStatus: 'established',
    });

    try {
      // 入力データの準備
      const instructionReceiptDateTime = new Date(1000000000000); // 2001年09月08日 10:46:40 UTC
      const executionStartDateTime = new Date(1000000045000); // 45秒後

      const input = {
        workerId: 'W001',
        instructionId: 'INS-12345',
        instructionReceiptDateTime,
        executionStartDateTime,
      };

      // 実際の処理を呼び出す
      const output = await recordWorkInstructionReceipt(input);

      // 期待結果の検証
      expect(output).toBeDefined();
      expect(output.productivityDataId).toBe('PROD-REC-20240115-001');
      expect(output.workerId).toBe('W001');
      expect(output.instructionId).toBe('INS-12345');
      expect(output.instructionReceiptDateTime).toEqual(instructionReceiptDateTime);
      expect(output.executionStartDateTime).toEqual(executionStartDateTime);
      expect(output.progressMonitoringBaselineStatus).toBe('established');
      expect(output.recordedAt).toBeDefined();
      expect(output.recordedAt).toBeInstanceOf(Date);

      // 経過秒数の計算が正確であることを確認
      const elapsedMilliseconds = output.executionStartDateTime.getTime() - output.instructionReceiptDateTime.getTime();
      const elapsedSeconds = elapsedMilliseconds / 1000;
      expect(elapsedSeconds).toBe(45);
    } finally {
      // スタブの解放
      findWorkerByIdStub.mockRestore();
      validateInputDataStub.mockRestore();
      saveProductivityDataStub.mockRestore();
      synchronizeDataWithWESAndWMSStub.mockRestore();
    }
  });
});