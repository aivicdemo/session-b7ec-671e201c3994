import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';
import * as workExecutionTracking from '../../src/logic/work-execution-tracking';

describe('SCEN-308: 実行開始時刻がシステム時刻より未来のとき、バリデーションエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executionStartDateTimeがシステム現在時刻より未来の場合、バリデーションエラーをスロー', async () => {
    const systemNowUtc = new Date('2024-01-15T10:00:00Z');
    const executionStartDateTime = new Date(systemNowUtc.getTime() + 60 * 1000); // 60秒未来
    const instructionReceiptDateTime = systemNowUtc;

    // validateInputDataスタブを設定
    const validateInputDataSpy = jest
      .spyOn(workExecutionTracking, 'validateInputData' as any)
      .mockResolvedValue(undefined);

    // findWorkerByIdスタブを設定
    const findWorkerByIdSpy = jest
      .spyOn(workExecutionTracking, 'findWorkerById' as any)
      .mockResolvedValue({
        workerId: 'W001',
        status: 'active',
      });

    // saveProductivityDataスパイを設定
    const saveProductivityDataSpy = jest.spyOn(
      workExecutionTracking,
      'saveProductivityData' as any
    );

    // synchronizeDataWithWESAndWMSスパイを設定
    const synchronizeDataWithWESAndWMSSpy = jest.spyOn(
      workExecutionTracking,
      'synchronizeDataWithWESAndWMS' as any
    );

    const input = {
      workerId: 'W001',
      instructionId: 'INS001',
      instructionReceiptDateTime,
      executionStartDateTime,
    };

    await expect(recordWorkInstructionReceipt(input)).rejects.toThrow(
      /ハンディターミナルの時刻がズレています。時刻同期を実行してください/
    );

    // saveProductivityDataおよびsynchronizeDataWithWESAndWMSが呼び出されていないことを検証
    expect(saveProductivityDataSpy).not.toHaveBeenCalled();
    expect(synchronizeDataWithWESAndWMSSpy).not.toHaveBeenCalled();
  });
});